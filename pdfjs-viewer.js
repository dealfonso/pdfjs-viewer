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

(function(exports) {
    "use strict";
    function jQuery_fallback() {
        const _creationDiv = document.createElement("div");
        function $(...elements) {
            const isHTML = element => element instanceof Element || element instanceof HTMLDocument;
            let context = this === undefined || this._$jqfallback === undefined ? [ document ] : this;
            let htmlObjects = [];
            if (elements.length === 0) {
                elements = [ ...context ];
            }
            for (let i in elements) {
                let element = elements[i];
                if (typeof element === "string") {
                    _creationDiv.innerHTML = element;
                    if (_creationDiv.children.length > 0) {
                        htmlObjects.push(..._creationDiv.children);
                        _creationDiv.innerHTML = "";
                    } else {
                        context.forEach((ctx, _) => {
                            htmlObjects.push(...ctx.querySelectorAll(element));
                        });
                    }
                } else if (isHTML(element)) {
                    htmlObjects.push(element);
                }
                if (Array.isArray(element)) {
                    element.map(e => $(e)).forEach((element, i) => htmlObjects.push(...element));
                } else if (typeof element === "function") {
                    $(document).on("DOMContentLoaded", element);
                }
            }
            Object.assign(htmlObjects, $);
            return htmlObjects;
        }
        $._$jqfallback = "1.0.0";
        $.attr = function(attributeName, attributeValue) {
            if (attributeValue === undefined) {
                return this[0].getAttribute(attributeName);
            }
            this.forEach(x => x.setAttribute(attributeName, attributeValue));
            return this;
        };
        $.data = function(attributeName, attributeValue) {
            if (attributeValue === undefined) {
                return this[0].dataset[attributeName];
            }
            this.forEach(x => x.dataset[attributeName] = attributeValue);
            return this;
        };
        $.addClass = function(className) {
            this.forEach(x => x.classList.add(className));
            return this;
        };
        $.hasClass = function(className) {
            if (this.length === 0) {
                return false;
            }
            return this[0].classList.contains(className);
        };
        $.removeClass = function(className) {
            this.forEach(x => x.classList.remove(className));
            return this;
        };
        $.toggleClass = function(className) {
            this.forEach(x => x.classList.toggle(className));
            return this;
        };
        $.width = function(width) {
            if (width === undefined) {
                return this[0].offsetWidth;
            }
            this.forEach(x => x.style.width = width + "px");
            return this;
        };
        $.height = function(height) {
            if (height === undefined) {
                return this[0].offsetHeight;
            }
            this.forEach(x => x.style.height = height + "px");
            return this;
        };
        $.append = function(element) {
            if (element instanceof HTMLElement) {
                if (this.length > 0) {
                    this[0].appendChild(element);
                }
            } else if (Array.isArray(element)) {
                element.forEach(x => this.append(x));
            } else if (typeof element === "string") {
                this.forEach(x => x.innerHTML += element);
            }
            return this;
        };
        $.find = function(selector) {
            let result = [];
            this.forEach(x => result.push(...Array.from(x.querySelectorAll(selector))));
            return $(result);
        };
        $.offset = function() {
            let rect = this[0].getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX
            };
        };
        $.outerHeight = function() {
            return this[0].offsetHeight;
        };
        $.outerWidth = function() {
            return this[0].offsetWidth;
        };
        $.position = function() {
            let rect = this[0].getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left
            };
        };
        $.empty = function() {
            this.forEach(x => x.innerHTML = "");
            return this;
        };
        $.get = function(index) {
            return this[index];
        };
        $.on = function(event, callback) {
            this.forEach(x => x.addEventListener(event, callback));
            return this;
        };
        $.off = function(event, callback) {
            this.forEach(x => x.removeEventListener(event, callback));
            return this;
        };
        $.each = function(callback) {
            callback = callback.bind(this);
            for (let i = 0; i < this.length; i++) {
                callback(i, this[i]);
            }
            return this;
        };
        $.remove = function() {
            this.forEach(x => x.remove());
            return this;
        };
        $.after = function(element) {
            this.forEach(x => x.insertAdjacentElement("afterend", ...$(element)));
            return this;
        };
        return $;
    }
    exports.jQuery_fallback = jQuery_fallback;
})(window);

(function(t) {
    (t => {
        const f = document.createElement("div");
        function h(...e) {
            const i = t => t instanceof Element || t instanceof HTMLDocument;
            let r = this._$version === undefined ? [ document ] : this;
            let s = [];
            if (e.length === 0) {
                e = [ ...r ];
            }
            for (let t in e) {
                let n = e[t];
                if (typeof n === "string") {
                    f.innerHTML = n;
                    if (f.children.length > 0) {
                        s.push(...f.children);
                        f.innerHTML = "";
                    } else {
                        r.forEach((t, e) => {
                            s.push(...t.querySelectorAll(n));
                        });
                    }
                } else if (i(n)) {
                    s.push(n);
                }
                if (Array.isArray(n)) {
                    n.map(t => h(t)).forEach((t, e) => s.push(...t));
                } else if (typeof n === "function") {
                    h(document).on("DOMContentLoaded", n);
                }
            }
            Object.assign(s, h);
            return s;
        }
        h._$version = "1.1.0";
        h.addClass = function(...e) {
            this.forEach((n, t) => {
                e.forEach((t, e) => n.classList.add(t));
            });
            return this;
        };
        h.removeClass = function(...e) {
            this.forEach((n, t) => {
                e.forEach((t, e) => n.classList.remove(t));
            });
            return this;
        };
        h.hasClass = function(t) {
            if (this.length === 0) {
                return false;
            }
            return this[0].classList.contains(t);
        };
        h.toggleClass = function(...e) {
            this.forEach((n, t) => {
                e.forEach((t, e) => n.classList.toggle(t));
            });
            return this;
        };
        h.on = function(i, n = t => {}) {
            this.forEach((t, e) => {
                if (t.__handlers == null) {
                    t.__handlers = {};
                }
                if (t.__handlers[i] == null) {
                    t.__handlers[i] = [];
                    t.addEventListener(i, n => {
                        t.__handlers[i].forEach((t, e) => {
                            t(n);
                        });
                    });
                }
                t.__handlers[i].push(n);
            });
            return this;
        };
        h.off = function(n, i = null) {
            this.forEach((e, t) => {
                if (e.__handlers == null) {
                    e.__handlers = {};
                }
                if (i == null) {
                    e.__handlers[n] = [];
                } else {
                    let t = 0;
                    while (t < e.__handlers[n].length) {
                        if (e.__handlers[n][t] == i) {
                            delete e.__handlers[n][t];
                        } else {
                            t++;
                        }
                    }
                }
            });
            return this;
        };
        h.attr = function(e, s) {
            if (typeof e === "string") {
                let n = e;
                let i = s;
                if (arguments.length == 1) {
                    if (this.length >= 1) {
                        return l(this[0], n);
                    }
                    return null;
                }
                this.forEach((t, e) => {
                    t.setAttribute(n, i);
                });
            } else if (Array.isArray(e)) {
                let t = e;
                let n = typeof s === "boolean" ? s : false;
                let i = {};
                let r = this[0] ?? null;
                t.forEach((t, e) => {
                    i[t] = l(r, t, n);
                });
                i.removeNulls = function() {
                    Object.keys(this).forEach(t => {
                        if (this[t] === null) {
                            delete this[t];
                        }
                    });
                    return this;
                }.bind(i);
                return i;
            } else if (typeof e === "object") {
                let i = e;
                let r = typeof s === "boolean" ? s : false;
                this.forEach((n, t) => {
                    for (let e in i) {
                        let t = r ? o(e) : e;
                        n.setAttribute(t, i[e]);
                    }
                });
            }
            return this;
        };
        h.droppable = function(n = t => {}, i = t => {}) {
            this.forEach((t, e) => {
                h(t).on("dragover", t => t.preventDefault());
                h(t).on("drop", t => {
                    t.preventDefault();
                    if (t.dataTransfer.files && t.dataTransfer.files.length > 0) {
                        n(t.dataTransfer.files);
                    } else {
                        i(t.dataTransfer);
                    }
                });
            });
            return this;
        };
        h.data = function(e, n) {
            if (n === undefined) {
                return this[0].dataset[e];
            }
            this.forEach(t => t.dataset[e] = n);
            return this;
        };
        h.width = function(e) {
            if (e === undefined) {
                if (this.length === 0) {
                    return 0;
                }
                return this[0].offsetWidth;
            }
            if (typeof e === "string") {
                e = parseInt(e);
                if (!isNaN(e)) {
                    e = e + "px";
                }
            }
            this.forEach(t => t.style.width = e);
            return this;
        };
        h.height = function(e) {
            if (e === undefined) {
                if (this.length === 0) {
                    return 0;
                }
                return this[0].offsetHeight;
            }
            if (typeof e === "string") {
                e = parseInt(e);
                if (!isNaN(e)) {
                    e = e + "px";
                }
            }
            this.forEach(t => t.style.height = e);
            return this;
        };
        h.offset = function() {
            if (this.length === 0) {
                return {
                    top: 0,
                    left: 0
                };
            }
            let t = this[0].getBoundingClientRect();
            return {
                top: t.top + window.scrollY,
                left: t.left + window.scrollX
            };
        };
        h.outerHeight = function() {
            if (this.length === 0) {
                return 0;
            }
            return this[0].offsetHeight;
        };
        h.outerWidth = function() {
            if (this.length === 0) {
                return 0;
            }
            return this[0].offsetWidth;
        };
        h.position = function() {
            if (this.length === 0) {
                return {
                    top: 0,
                    left: 0
                };
            }
            let t = this[0].getBoundingClientRect();
            return {
                top: t.top,
                left: t.left
            };
        };
        h.empty = function() {
            this.forEach(t => t.innerHTML = "");
            return this;
        };
        h.remove = function() {
            this.forEach(t => t.remove());
            return this;
        };
        h.append = function(e) {
            if (e instanceof HTMLElement) {
                if (this.length > 0) {
                    this[0].appendChild(e);
                }
            } else if (Array.isArray(e)) {
                e.forEach(t => this.append(t));
            } else if (typeof e === "string") {
                this.forEach(t => t.innerHTML += e);
            }
            return this;
        };
        h.prepend = function(e) {
            if (e instanceof HTMLElement) {
                if (this.length > 0) {
                    this[0].insertBefore(e, this[0].firstChild);
                }
            } else if (Array.isArray(e)) {
                e.forEach(t => this.prepend(t));
            } else if (typeof e === "string") {
                this.forEach(t => t.innerHTML = e + t.innerHTML);
            }
            return this;
        };
        h.after = function(e) {
            if (e instanceof HTMLElement) {
                this.forEach(t => t.insertAdjacentElement("afterend", e));
            } else if (Array.isArray(e)) {
                e.forEach(t => this.after(t));
            } else if (typeof e === "string") {
                this.forEach(t => t.insertAdjacentHTML("afterend", e));
            }
            return this;
        };
        h.before = function(e) {
            if (e instanceof HTMLElement) {
                this.forEach(t => t.insertAdjacentElement("beforebegin", e));
            } else if (Array.isArray(e)) {
                e.forEach(t => this.before(t));
            } else if (typeof e === "string") {
                this.forEach(t => t.insertAdjacentHTML("beforebegin", e));
            }
            return this;
        };
        h.find = function(e) {
            let n = [];
            this.forEach(t => n.push(...Array.from(t.querySelectorAll(e))));
            return h(n);
        };
        h.get = function(t) {
            if (t === undefined) {
                return this;
            }
            if (this.length === 0 || t < 0 || t >= this.length) {
                return null;
            }
            return this[t];
        };
        h.each = function(e) {
            e = e.bind(this);
            for (let t = 0; t < this.length; t++) {
                e(t, this[t]);
            }
            return this;
        };
        h._$ = function(...t) {
            return h.bind(this)(...t);
        };
        function l(t, e, n = false) {
            if (t === null) {
                return null;
            }
            let i = e.split(":");
            e = i[0];
            let r = n ? o(e) : e;
            let s = t.getAttribute(r);
            if (s != null) {
                let t = "string";
                if (i.length > 1) {
                    t = i[1].toLowerCase();
                }
                switch (t) {
                  case "int":
                    try {
                        s = parseInt(s);
                    } catch (t) {}
                    ;
                    break;

                  case "float":
                    try {
                        s = parseFloat(s);
                    } catch (t) {}
                    ;
                    break;

                  case "bool":
                    s = [ "", "true", "1" ].indexOf(s.toLowerCase()) >= 0;
                    break;
                }
            }
            return s;
        }
        const o = t => t.replace(/[A-Z]/g, t => `-${t.toLowerCase()}`);
        t._$ = h;
    })(window);
})(window);

(function(exports, $) {
    "use strict";
    if ($ === undefined) {
        console.error("jQuery-like library not available");
        return;
    }
    let defaults = {
        visibleThreshold: .5,
        extraPagesToLoad: 3,
        pageClass: "pdfpage",
        contentClass: "content-wrapper",
        onDocumentReady: () => {},
        onNewPage: (page, i) => {},
        onPageRender: (page, i) => {},
        zoomValues: [ .25, .5, .75, 1, 1.25, 1.5, 2, 4, 8 ],
        onZoomChange: zoomlevel => {},
        onActivePageChanged: (page, i) => {},
        zoomFillArea: .95,
        emptyContent: () => $('<div class="loader"></div>'),
        renderingScale: 1.5
    };
    class Zoomer {
        constructor(viewer, options = {}) {
            let defaults = {
                zoomValues: [ .25, .5, .75, 1, 1.25, 1.5, 2, 4, 8 ],
                fillArea: .9
            };
            this.current = 1;
            this.viewer = viewer;
            this.settings = Object.assign({}, defaults, options);
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
        version = "1.2.0";
        constructor($container, options = {}) {
            this.settings = Object.assign({}, defaults, options);
            this._zoom = new Zoomer(this, {
                zoomValues: this.settings.zoomValues,
                fillArea: this.settings.zoomFillArea
            });
            $container = $($container);
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
                    if (typeof this.settings.onNewPage === "function") {
                        this.settings.onNewPage.call(this, pageinfo.$div.get(0), i);
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
        _setActivePage(i) {
            if (this._activePage !== i) {
                this._activePage = i;
                let activePage = this.getActivePage();
                if (this._documentReady) {
                    activePage = activePage == null ? null : activePage.get(0);
                    if (typeof this.settings.onActivePageChanged === "function") {
                        this.settings.onActivePageChanged.call(this, activePage, i);
                    }
                    this.$container.get(0).dispatchEvent(new CustomEvent("activepagechanged", {
                        detail: {
                            activePageNumber: i,
                            activePage: activePage
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
            if (typeof i === "string") {
                i = parseInt(i);
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
            let visibles = $visibles.map(x => parseInt($(x).data("page")));
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
            let scale = this.settings.renderingScale;
            let pixel_ratio = window.devicePixelRatio || 1;
            let viewport = page.getViewport({
                rotation: this._rotation,
                scale: this._zoom.current * scale
            });
            pageinfo.width = viewport.width / this._zoom.current / scale;
            pageinfo.height = viewport.height / this._zoom.current / scale;
            pageinfo.$div.data("width", pageinfo.width);
            pageinfo.$div.data("height", pageinfo.height);
            pageinfo.$div.width(pageinfo.width * this._zoom.current);
            pageinfo.$div.height(pageinfo.height * this._zoom.current);
            pageinfo.loaded = true;
            let $canvas = $("<canvas></canvas>");
            let canvas = $canvas.get(0);
            let context = canvas.getContext("2d");
            canvas.height = viewport.height * pixel_ratio;
            canvas.width = viewport.width * pixel_ratio;
            canvas.getContext("2d");
            var transform = pixel_ratio !== 1 ? [ pixel_ratio, 0, 0, pixel_ratio, 0, 0 ] : null;
            var renderContext = {
                canvasContext: context,
                viewport: viewport,
                transform: transform
            };
            return page.render(renderContext).promise.then(function() {
                this._setPageContent(pageinfo.$div, $canvas);
                if (this._documentReady) {
                    if (typeof this.settings.onPageRender === "function") {
                        this.settings.onPageRender.call(this, pageinfo.$div.get(0), i);
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
        if (options["pdfDocument"] != null) {
            let pdfViewer = new PDFjsViewer($(element), options);
            pdfViewer.loadDocument(options["pdfDocument"]).then(function() {
                if (options["initialZoom"] != null) {
                    pdfViewer.setZoom(options["initialZoom"]);
                }
            });
            element.get(0).pdfViewer = pdfViewer;
        }
    }
    $(function() {
        $(".pdfjs-viewer").each(function() {
            let $viewer = $(this);
            init($viewer);
        });
    });
    exports.PDFjsViewer = PDFjsViewer;
})(window, window._$ ?? window.jQuery ?? undefined);
