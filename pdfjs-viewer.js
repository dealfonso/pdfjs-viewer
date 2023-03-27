/**
   Copyright 2021 Carlos A. (https://github.com/dealfonso)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

(function(exports, $) {
    "use strict";
    let defaults = {
        visibleThreshold: .5,
        extraPagesToLoad: 3,
        pageClass: "pdfpage",
        contentClass: "content-wrapper",
        onDocumentReady: () => {},
        onNewPage: (page, i) => {},
        onPageRender: (page, i) => {},
        errorPage: () => {
            $(`<div class="placeholder"></div>`).addClass(this.settings.pageClass).append($(`<p class="m-auto"></p>`).text("could not load document"));
        },
        zoomValues: [ .25, .5, .75, 1, 1.25, 1.5, 2, 4, 8 ],
        onZoomChange: zoomlevel => {},
        onActivePageChanged: (page, i) => {},
        zoomFillArea: .95,
        emptyContent: () => $('<div class="loader"></div>')
    };
    class Zoomer {
        constructor(viewer, options = {}) {
            let defaults = {
                zoomValues: [ .25, .5, .75, 1, 1.25, 1.5, 2, 4, 8 ],
                fillArea: .9
            };
            this.current = 1;
            this.viewer = viewer;
            this.settings = $.extend(defaults, options);
            this.settings.zoomValues = this.settings.zoomValues.sort();
        }
        get(zoom = null) {
            if (zoom === null) {
                return this.current;
            }
            if (parseFloat(zoom) == zoom) {
                return zoom;
            }
            let $activepage = this.viewer.getActivePage();
            let zoomValues = [];
            switch (zoom) {
              case "in":
                zoom = this.current;
                zoomValues = this.settings.zoomValues.filter(x => x > zoom);
                if (zoomValues.length > 0) {
                    zoom = Math.min(...zoomValues);
                }
                break;

              case "out":
                zoom = this.current;
                zoomValues = this.settings.zoomValues.filter(x => x < zoom);
                if (zoomValues.length > 0) {
                    zoom = Math.max(...zoomValues);
                }
                break;

              case "fit":
                zoom = Math.min(this.get("width"), this.get("height"));
                break;

              case "width":
                zoom = this.settings.fillArea * this.viewer.$container.width() / $activepage.data("width");
                break;

              case "height":
                zoom = this.settings.fillArea * this.viewer.$container.height() / $activepage.data("height");
                break;

              default:
                zoom = this.current;
                break;
            }
            return zoom;
        }
        zoomPages(zoom) {
            zoom = this.get(zoom);
            this.viewer.getPages().forEach(function(page) {
                let $page = page.$div;
                let c_width = $page.data("width");
                let c_height = $page.data("height");
                $page.width(c_width * zoom).height(c_height * zoom);
                $page.data("zoom", zoom);
                $page.find(`.${this.viewer.settings.contentClass}`).width(c_width * zoom).height(c_height * zoom);
            }.bind(this));
            this.current = zoom;
        }
    }
    class PDFjsViewer {
        constructor($container, options = {}) {
            this.settings = $.extend(Object.assign({}, defaults), options);
            this._zoom = new Zoomer(this, {
                zoomValues: this.settings.zoomValues,
                fillArea: this.settings.zoomFillArea
            });
            this.$container = $container;
            $container.get(0)._pdfjsViewer = this;
            this._setScrollListener();
            this.pages = [];
            this.pdf = null;
            this._documentReady = false;
        }
        setZoom(zoom) {
            let container = this.$container.get(0);
            let prevzoom = this._zoom.current;
            let prevScroll = {
                top: container.scrollTop,
                left: container.scrollLeft
            };
            this._zoom.zoomPages(zoom);
            container.scrollLeft = prevScroll.left * this._zoom.current / prevzoom;
            container.scrollTop = prevScroll.top * this._zoom.current / prevzoom;
            this._visiblePages(true);
            if (this._documentReady) {
                if (typeof this.settings.onZoomChange === "function") this.settings.onZoomChange.call(this, this._zoom.current);
                this.$container.get(0).dispatchEvent(new CustomEvent("zoomchange", {
                    detail: {
                        zoom: this._zoom.current
                    }
                }));
            }
            return this._zoom.current;
        }
        getZoom() {
            return this._zoom.current;
        }
        _cleanPage($page) {
            let $emptyContent = this.settings.emptyContent();
            $page.find(`.${this.settings.contentClass}`).empty().append($emptyContent);
        }
        _setPageContent($page, $content) {
            $page.find(`.${this.settings.contentClass}`).empty().append($content);
        }
        refreshAll() {
            this._visiblePages(true);
        }
        _setScrollListener() {
            let scrollLock = false;
            let scrollPos = {
                top: 0,
                left: 0
            };
            this.__scrollHandler = function(e) {
                if (scrollLock === true) {
                    return;
                }
                scrollLock = true;
                let container = this.$container.get(0);
                if (Math.abs(container.scrollTop - scrollPos.top) > container.clientHeight * .2 * this._zoom.current || Math.abs(container.scrollLeft - scrollPos.left) > container.clientWidth * .2 * this._zoom.current) {
                    scrollPos = {
                        top: container.scrollTop,
                        left: container.scrollLeft
                    };
                    this._visiblePages();
                }
                scrollLock = false;
            }.bind(this);
            this.$container.off("scroll");
            this.$container.on("scroll", this.__scrollHandler);
        }
        _createSkeleton(page, i) {
            let pageinfo = {
                $div: null,
                width: 0,
                height: 0,
                loaded: false
            };
            if (page.getViewport !== undefined) {
                let viewport = page.getViewport({
                    rotation: this._rotation,
                    scale: 1
                });
                pageinfo.width = viewport.width;
                pageinfo.height = viewport.height;
                pageinfo.loaded = true;
            } else {
                pageinfo.width = page.width;
                pageinfo.height = page.height;
            }
            console.assert(pageinfo.width > 0 && pageinfo.height > 0, "Page width and height must be greater than 0");
            pageinfo.$div = $(`<div id="page-${i}">`).attr("data-page", i).data("width", pageinfo.width).data("height", pageinfo.height).data("zoom", this._zoom.current).addClass(this.settings.pageClass).width(pageinfo.width * this._zoom.current).height(pageinfo.height * this._zoom.current);
            let $content = $(`<div class="${this.settings.contentClass}">`).width(pageinfo.width).height(pageinfo.height);
            pageinfo.$div.append($content);
            this._cleanPage(pageinfo.$div);
            return pageinfo;
        }
        _placeSkeleton(pageinfo, i) {
            let prevpage = i - 1;
            let $prevpage = null;
            while (prevpage > 0 && ($prevpage = this.$container.find(`.${this.settings.pageClass}[data-page="${prevpage}"]`)).length === 0) {
                prevpage--;
            }
            if (prevpage === 0) {
                this.$container.append(pageinfo.$div);
            } else {
                $prevpage.after(pageinfo.$div);
            }
        }
        _createSkeletons(pageinfo) {
            for (let i = 1; i <= this.pageCount; i++) {
                if (this.pages[i] === undefined) {
                    pageinfo = this._createSkeleton(pageinfo, i);
                    this.pages[i] = pageinfo;
                    this._placeSkeleton(pageinfo, i);
                    if (this._documentReady) {
                        if (typeof this.settings.onNewPage === "function") {
                            this.settings.onNewPage.call(this, pageinfo.$div, i);
                        }
                        this.$container.get(0).dispatchEvent(new CustomEvent("newpage", {
                            detail: {
                                pageNumber: i,
                                page: pageinfo.$div.get(0)
                            }
                        }));
                    }
                }
            }
        }
        _setActivePage(i) {
            if (this._activePage !== i) {
                this._activePage = i;
                let activePage = this.getActivePage();
                if (this._documentReady) {
                    if (typeof this.settings.onActivePageChanged === "function") this.settings.onActivePageChanged.call(this, activePage, i);
                    this.$container.get(0).dispatchEvent(new CustomEvent("activepagechanged", {
                        detail: {
                            activePageNumber: i,
                            activePage: activePage == null ? null : activePage.get(0)
                        }
                    }));
                }
            }
        }
        _areaOfPageVisible($page) {
            if ($page === undefined) {
                return 0;
            }
            let c_offset = this.$container.offset();
            let c_width = this.$container.width();
            let c_height = this.$container.height();
            let position = $page.offset();
            position.top -= c_offset.top;
            position.left -= c_offset.left;
            position.bottom = position.top + $page.outerHeight();
            position.right = position.left + $page.outerWidth();
            let page_y0 = Math.min(Math.max(position.top, 0), c_height);
            let page_y1 = Math.min(Math.max($page.outerHeight() + position.top, 0), c_height);
            let page_x0 = Math.min(Math.max(position.left, 0), c_width);
            let page_x1 = Math.min(Math.max($page.outerWidth() + position.left, 0), c_width);
            let vis_x = page_x1 - page_x0;
            let vis_y = page_y1 - page_y0;
            return vis_x * vis_y;
        }
        isPageVisible(i) {
            if (this.pdf === null || i === undefined || i === null || i < 1 || i > this.pdf.numPages) {
                return false;
            }
            let $page = i;
            if (typeof i === "number") {
                if (this.pages[i] === undefined) return false;
                $page = this.pages[i].$div;
            }
            return this._areaOfPageVisible($page) > $page.outerWidth() * $page.outerHeight() * this.settings.visibleThreshold;
        }
        _visiblePages(forceRedraw = false) {
            let max_area = 0;
            let i_page = null;
            if (this.pages.length === 0) {
                this._visibles = [];
                this._setActivePage(0);
                return;
            }
            let $visibles = this.pages.filter(function(pageinfo) {
                let areaVisible = this._areaOfPageVisible(pageinfo.$div);
                if (areaVisible > max_area) {
                    max_area = areaVisible;
                    i_page = pageinfo.$div.data("page");
                }
                return areaVisible > 0;
            }.bind(this)).map(x => x.$div);
            this._setActivePage(i_page);
            let visibles = $visibles.map(x => $(x).data("page"));
            if (visibles.length > 0) {
                let minVisible = Math.min(...visibles);
                let maxVisible = Math.max(...visibles);
                for (let i = Math.max(1, minVisible - this.settings.extraPagesToLoad); i < minVisible; i++) {
                    if (!visibles.includes(i)) visibles.push(i);
                }
                for (let i = maxVisible + 1; i <= Math.min(maxVisible + this.settings.extraPagesToLoad, this.pdf.numPages); i++) {
                    if (!visibles.includes(i)) visibles.push(i);
                }
            }
            let nowVisibles = visibles;
            if (!forceRedraw) {
                nowVisibles = visibles.filter(function(x) {
                    return !this._visibles.includes(x);
                }.bind(this));
            }
            this._visibles.filter(function(x) {
                return !visibles.includes(x);
            }).forEach(function(i) {
                this._cleanPage(this.pages[i].$div);
            }.bind(this));
            this._visibles = visibles;
            this.loadPages(...nowVisibles);
        }
        loadPages(...pages) {
            this._pagesLoading.push(...pages);
            if (this._loading) {
                return;
            }
            this._loadingTask();
        }
        _loadingTask() {
            this._loading = true;
            if (this._pagesLoading.length > 0) {
                let pagei = this._pagesLoading.shift();
                this.pdf.getPage(pagei).then(function(page) {
                    this._renderPage(page, pagei);
                }.bind(this)).then(function(pageinfo) {
                    if (this._pagesLoading.length > 0) {
                        this._loadingTask();
                    }
                }.bind(this));
            }
            this._loading = false;
        }
        scrollToPage(i) {
            if (this.pages.length === 0 || this.pages[i] === undefined) {
                return;
            }
            let $page = this.pages[i].$div;
            if ($page.length === 0) {
                console.warn(`Page ${i} not found`);
                return;
            }
            let position = $page.position();
            let containerPosition = this.$container.position();
            if (position !== undefined) {
                this.$container.get(0).scrollTop = this.$container.get(0).scrollTop + position.top - containerPosition.top;
                this.$container.get(0).scrollLeft = this.$container.get(0).scrollLeft + position.left - containerPosition.left;
            }
            this._setActivePage(i);
        }
        _renderPage(page, i) {
            let pageinfo = this.pages[i];
            let pixel_ratio = Math.max(window.devicePixelRatio || 1, 1);
            let viewport = page.getViewport({
                rotation: this._rotation,
                scale: this._zoom.current * pixel_ratio
            });
            pageinfo.width = viewport.width / this._zoom.current / pixel_ratio;
            pageinfo.height = viewport.height / this._zoom.current / pixel_ratio;
            pageinfo.$div.data("width", pageinfo.width);
            pageinfo.$div.data("height", pageinfo.height);
            pageinfo.$div.width(pageinfo.width * this._zoom.current);
            pageinfo.$div.height(pageinfo.height * this._zoom.current);
            pageinfo.loaded = true;
            let $canvas = $("<canvas></canvas>");
            let canvas = $canvas.get(0);
            let context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.getContext("2d");
            var renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            return page.render(renderContext).promise.then(function() {
                this._setPageContent(pageinfo.$div, $canvas);
                if (this._documentReady) {
                    if (typeof this.settings.onPageRender === "function") {
                        this.settings.onPageRender.call(this, pageinfo.$div, i);
                    }
                    this.$container.get(0).dispatchEvent(new CustomEvent("pagerender", {
                        detail: {
                            pageNumber: i,
                            page: pageinfo.$div.get(0)
                        }
                    }));
                }
                return pageinfo;
            }.bind(this));
        }
        getActivePage() {
            if (this._activePage === null || this.pdf === null) {
                return null;
            }
            if (this._activePage < 1 || this._activePage > this.pdf.numPages) {
                return null;
            }
            return this.pages[this._activePage].$div;
        }
        getPages() {
            return this.pages;
        }
        getPageCount() {
            if (this.pdf === null) {
                return 0;
            }
            return this.pdf.numPages;
        }
        next() {
            if (this._activePage < this.pdf.numPages) {
                this.scrollToPage(this._activePage + 1);
            }
        }
        prev() {
            if (this._activePage > 1) {
                this.scrollToPage(this._activePage - 1);
            }
        }
        first() {
            if (this._activePage !== 1) {
                this.scrollToPage(1);
            }
        }
        last() {
            if (this.pdf === null) return;
            if (this._activePage !== this.pdf.numPages) {
                this.scrollToPage(this.pdf.numPages);
            }
        }
        rotate(deg, accumulate = false) {
            if (accumulate) {
                deg = deg + this._rotation;
            }
            this._rotation = deg;
            let container = this.$container.get(0);
            let prevScroll = {
                top: container.scrollTop,
                left: container.scrollLeft,
                height: container.scrollHeight,
                width: container.scrollWidth
            };
            return this.forceViewerInitialization().then(function() {
                let newScroll = {
                    top: container.scrollTop,
                    left: container.scrollLeft,
                    height: container.scrollHeight,
                    width: container.scrollWidth
                };
                container.scrollTop = prevScroll.top * (newScroll.height / prevScroll.height);
                container.scrollLeft = prevScroll.left * (newScroll.width / prevScroll.width);
            }.bind(this));
        }
        forceViewerInitialization() {
            this.pages = [];
            this.$container.find(`.${this.settings.pageClass}`).remove();
            this._pagesLoading = [];
            this._loading = false;
            this._visibles = [];
            this._activePage = null;
            return this.pdf.getPage(1).then(function(page) {
                this._createSkeletons(page);
                this._visiblePages();
                this._setActivePage(1);
            }.bind(this));
        }
        async loadDocument(document) {
            this._documentReady = false;
            this.pages = [];
            this.$container.find(`.${this.settings.pageClass}`).remove();
            this.pdf = null;
            let loadingTask = pdfjsLib.getDocument(document);
            return loadingTask.promise.then(function(pdf) {
                this.pdf = pdf;
                this.pageCount = pdf.numPages;
                this._rotation = 0;
                return this.forceViewerInitialization();
            }.bind(this)).then(function() {
                if (typeof this.settings.onDocumentReady === "function") {
                    this.settings.onDocumentReady.call(this);
                }
                this.$container.get(0).dispatchEvent(new CustomEvent("documentready", {
                    detail: {
                        document: this.pdf
                    }
                }));
                this._setActivePage(0);
                this._documentReady = true;
                this._setActivePage(1);
            }.bind(this));
        }
    }
    function recoverAttributes(target, attributeDefaults) {
        const camelcaseToSnakecase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        let $target = $(target);
        let result = {};
        if ($target.length > 0) {
            $target = $($target[0]);
            for (let originalAttributeName in attributeDefaults) {
                let attributeName = camelcaseToSnakecase(originalAttributeName);
                let attributeValue = $target.attr(attributeName);
                if (attributeValue != null) {
                    switch (typeof attributeDefaults[originalAttributeName]) {
                      case "float":
                        try {
                            attributeValue = parseFloat(attributeValue);
                        } catch (_) {}
                        break;

                      case "number":
                        try {
                            attributeValue = parseInt(attributeValue);
                        } catch (_) {}
                        break;

                      case "function":
                        let functionString = attributeValue;
                        attributeValue = function() {
                            eval(functionString);
                        }.bind(target[0]);
                        break;

                      default:
                        break;
                    }
                    result[originalAttributeName] = attributeValue;
                }
            }
        }
        return result;
    }
    function init(element) {
        let options = recoverAttributes(element, Object.assign({
            pdfDocument: "",
            initialZoom: ""
        }, defaults));
        let pdfViewer = new PDFjsViewer($(element), options);
        if (options["pdfDocument"] != null) {
            pdfViewer.loadDocument(options["pdfDocument"]).then(function() {
                if (options["initialZoom"] != null) {
                    pdfViewer.setZoom(options["initialZoom"]);
                }
            });
        }
        element.get(0).pdfViewer = pdfViewer;
    }
    $(function() {
        $(".pdfjs-viewer").each(function() {
            let $viewer = $(this);
            init($viewer);
        });
    });
    exports.PDFjsViewer = PDFjsViewer;
})(window, jQuery);
