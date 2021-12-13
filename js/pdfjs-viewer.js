/*
   Copyright 2020 Carlos de Alfonso (https://github.com/dealfonso)

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

(function (exports, $) {
    "use strict";

    /**
     * jQuery plugin to get the position and size of an element, taking into account the zoom level
     */
    $.fn.getRelativeSize = function() {
        let $this = $(this);
        let zoom = $this.attr("data-zoom");
        if (zoom === undefined)
            zoom = 1;
        zoom = parseFloat(zoom);
        let position = $this.position();
        return { top: position.top / zoom, left: position.left / zoom, width: $this.width() / zoom, height: this.height() / zoom };
    }

    /**
     * jQuery plugin to vary the size of an element, according to the zoom level; the position is also updated, if needed
     */
     $.fn.zoom = function(zoom) {
        $(this).each(function() {
            let $this = $(this);
            let rel_size = $this.getRelativeSize();

            if (["absolute", "fixed"].indexOf($this.css('position')) !== -1) {
                let poffset = $this.parent().offset();
                $this.offset({left: poffset.left + (rel_size.left * zoom), top: poffset.top + (rel_size.top * zoom)});
            }

            $this.width(rel_size.width * zoom);
            $this.height(rel_size.height * zoom);
            $this.attr("data-zoom", zoom);
        })
    }        

    /** Class to manage zoom operations for the PDF viewer */
    class Zoom {
        constructor($container, options) {
            let defaults = {
                // Possible values for zoom
                values: [ 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.50, 2, 4, 8, 16, 32 ],

                // Function called when the zoom changes
                onZoomChange: () => {},

                // Function used to get the page that is being displayed. The function should return a jQuery object
                //   the function is called if the zoom is set to a value relative to the page (i.e. "width", "height" or "fit")
                getCurrentPage: () => null,

                // Amount of space to fill when zooming to a page
                fillArea: 0.9,
            }
            this.settings = $.extend({}, defaults, options);

            // The current zoom value
            this.current = 1;

            // The container
            this.$container = $container;
        }

        /** Function to zoom all the elements (gets the current value and calculates the nearest value in the list). Then
         *    if "up" is true, it will apply the next zoom level; otherwise it will apply the previous zoom level.
         *  @param {boolean} up - If true, it will apply the next zoom level; otherwise it will apply the previous zoom level.
         */
        zoom(up = false) {
            let diffzoom = this.current;
            let i_zoom = 0;
            for (let i=0; i<this.settings.values.length; i++) {
                if (Math.abs(this.settings.values[i] - this.current) < diffzoom) {
                    diffzoom = Math.abs(this.settings.values[i] - this.current);
                    i_zoom = i;
                }
            }
            i_zoom += up?1:-1;
            i_zoom = Math.max(0, Math.min(this.settings.values.length - 1, i_zoom));
            this.apply(this.settings.values[i_zoom]);
        }
        /** Function that applies an arbitrary amount of zoom to any element that has a 'data-zoom' attribute. This function
         *    makes use of $.fn.zoom function, so it adjusts the relative position and size of any element. At the end,
         *    it calls the onZoomChange function, if it is defined.
         *    @param {number} zoom - The zoom value to apply
         */
        apply(zoom = null) {
            this.current = this.get(zoom);
            let height = this.$container.height();

            // Hacemos zoom en las paginas y en la seleccion (si la hay, porque tendran un zoom asignado)
            this.$container.find("[data-zoom]").zoom(this.current);

            // Ajustamos la posicion del scroll de acuerdo a lo que ha crecido el wrapper
            let height_ratio = this.$container.height() / height;
            this.$container.get(0).scrollTop = this.$container.get(0).scrollTop * height_ratio;

            // Llamamos al callback de cambio de zoom
            if (typeof this.settings.onZoomChange === 'function') {
                this.settings.onZoomChange(this.current);
            }
        }
        /**
         * Sanitizes a value of zoom: if null, the function returns the current zoom value; if undefined, will return 1, if set to
         *    a relative value to the page (i.e. "width" or "height" or "fit"), will calculate the appropriate zoom value; otherwise,
         *    will return the value as is.
         * @param {number} zoom the zoom value
         * @returns the sanitized zoom value
         */
        get(zoom = null) {
            if (zoom === null)
                zoom = this.current;

            if (zoom === undefined)
                zoom = 1;

            if ((zoom == "width") || (zoom == "height") || (zoom == "fit")) {
                let $currentpage = this.settings.getCurrentPage.call(this);
                if (($currentpage === undefined) || ($currentpage === null) || ($currentpage.length === 0))
                    return 1;
                let $wrapper = this.$container;
                switch (zoom) {
                    case "width":
                        return ($wrapper.width() * this.settings.fillArea) / parseFloat($currentpage.data('width'));
                    case "height":
                        return ($wrapper.height() * this.settings.fillArea) / parseFloat($currentpage.data('height'));
                    default:
                        return Math.min($wrapper.width() * this.settings.fillArea / parseFloat($currentpage.data('width')), $wrapper.height() * this.settings.fillArea / parseFloat($currentpage.data('height')))
                }
            }
            return parseFloat(zoom);
        }        
    }

    class PDFjsViewer {
        lastPage = 0;
        currentPage = 1;
        settings = {};
        zoom = null;

        /**
         * Constructs the object, and initializes actions:
         *   - add the scroll handler to the container
         *   - set the first adjusting action when the page is loaded
         *   - creates the zoom helper
         * @param {jQuery} $container the jQuery value that will hold the pages
         * @param {dictionary} options options for the viewer
         */
        constructor($container, options = {}) {

            let defaults = {
                // Whether to enable zoom or not
                enableZoom: true,
                // The class used for each page
                pageClass: "pdfpage",
                // The target resolution to render the images; it can be a string and it will be adjusted to the standard value: "FHD", "HD", "SD", "4K", "THUMBNAIL"
                pageResolution: {
                    width: 1920,
                    height: 1080
                },
                // Function called when a new page is created (it is binded to the object, and receives a jQuery object as parameter)
                onNewPage: (page) => {},
                // Function called to obtain a page that shows an error when the document could not be loaded (returns a jQuery object)
                errorPage: () => {
                    $(`<div class="placeholder"></div>`).addClass(this.settings.pageClass).append($(`<p class="m-auto"></p>`).text("could not load document"))
                },
                // Posible zoom values
                zoomValues: [ 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.50, 2, 4, 8, 16, 32 ],
                // Function called when the zoom level changes (it receives the zoom level)
                onZoomChange: (zoomlevel) => {},
                // Function used to calculate the placement of the container of the pdf pages. Called by the function "adjustPlacement". 
                //   It returns an object { top: <value>, left: <value>, width: <value>, height: <value>, height: <value> }
                // * The default function spans the container in the whole size of the parent object
                calculatePlacement: () => {
                    let $viewerContainer = this.$container.parent();
                    let offset = $viewerContainer.offset();
                    offset.width = $viewerContainer.width();
                    offset.height = $viewerContainer.height();
                    return offset;
                },
                // Function called whenever the active page is changed (the active page is the one that is shown in the viewer)
                onActivePageChanged: (page) => {},
                // Percentage of the container that will be filled with the page
                zoomFillArea: 0.9,
            }
            
            $.extend(this.settings, defaults, options);

            // Adjust the resolution to the standard values
            if (typeof this.settings.pageResolution === "string") {
                switch (this.settings.pageResolution) {
                    case "FHD":
                        this.settings.pageResolution = {
                            width: 1920,
                            height: 1080
                        };
                        break;
                    case "HD":
                        this.settings.pageResolution = {
                            width: 1280,
                            height: 720
                        };
                        break;
                    case "SD":
                        this.settings.pageResolution = {
                            width: 640,
                            height: 480
                        };
                        break;
                    case "4K":
                        this.settings.pageResolution = {
                            width: 3840,
                            height: 2160
                        };
                        break;
                    case "8K":
                        this.settings.pageResolution = {
                            width: 7680,
                            height: 4320
                        };
                        break;
                    case "THUMBNAIL":
                        this.settings.pageResolution = {
                            width: 320,
                            height: 240
                        };
                        break;
                    default:
                        this.settings.pageResolution = {
                            width: 1920,
                            height: 1080
                        };
                        break;
                }
            }

            // Create the zoom manager, if needed
            if (this.settings.enableZoom) {
                this.zoom = new Zoom($container, {
                    values: this.settings.zoomValues,
                    onZoomChange: function (current) {
                        if (typeof this.settings.onZoomChange === 'function') {
                            this.settings.onZoomChange.call(this, current);
                        }
                        this.loadMorePages().catch(error => {console.error(error)});
                    }.bind(this),
                    getCurrentPage: function() {
                        return this.getCurrentPage()
                    }.bind(this),
                    fillArea: this.settings.zoomFillArea
                });
            }

            // Store the container
            this.$container = $container;

            // Add a reference to this object to the container
            $container.get(0)._pdfjsViewer = this;

            this.__setScrollListener();
            this.__setResizeListener();
        }
        
        /** Function that creates a scroll handler to update the active page and to load more pages as the scroll position changes */
        __setScrollListener() {
            // Create a scroll handler that prevents reentrance if called multiple times and the loading of pages is not finished
            let scrollLock = false;

            this.__scrollHandler = function() {
                // Avoid re-enterntrance for the same event while loading pages
                if (scrollLock === true) {
                    return;
                }
                scrollLock = true;

                // Calculate the current page and load more pages if needed
                this.updateActivePage();
                this.loadMorePages().then(function() {
                    scrollLock = false;
                });
            }.bind(this);

            // Set the scroll handler
            this.$container.off('scroll');
            this.$container.on('scroll', this.__scrollHandler);            
        }

        /** Function that creates a handler for the onResize event in the window, so that the viewer can be resized
         *    if the parent container is resized. The handler relies on the function "calculatePlacement" to calculate 
         *    the new size and position of the viewer.
         */
        __setResizeListener() {
            this.__resizeListener = function() {
                if (typeof this.settings.calculatePlacement === 'function') {
                    let offset = this.settings.calculatePlacement.call(this);
                    if (offset !== null) {
                        this.$container.css({
                            top: offset.top,
                            left: offset.left,
                            width: offset.width,
                            height: offset.height
                        });
                    }
                }
            }.bind(this);

            // Now set the handler and force the call to adjust initial placement, when the document is available
            window.addEventListener('resize', this.__resizeListener);
            let self = this;
            $(function() {
                self.adjustPlacement();
            });
        }

        /**
         * Function that returns true if the page is visible in the container (at least, in a half of the page)
         * @param {jQuery} $page 
         * @returns true if the page is visible in the container; false otherwise
         */
        isPageVisible($page) {
            if (($page === undefined) || ($page === null)) {
                return false;
            }
            let height = this.$container.height();
            let offset = $page.offset();
            if (offset === undefined) {
                return false;
            }

            // Adjust the offset depending of the position of the parent (i.e. the container)
            let p_offset = this.$container.offset();
            offset.top -= p_offset.top;

            // If the amount of page visible is inside the container (i.e. at least, the half of the page), return true
            let page_y0 = Math.min(Math.max(offset.top, 0), height);
            let page_y1 = Math.min(Math.max($page.height() + offset.top, 0), height);
            return ((page_y1 - page_y0) > ($page.height() / 2));
        }

        /**
         * Tries to identify which is the page that is active in the viewer: it is the one that has more visible area in the container
         * @returns {jQuery} the page that is active in the viewer
         */
        getCurrentPage() {
            let currentPage = null;
            let height = this.$container.height();
            let page_in_max = -1;
            this.$container.find(`.${this.settings.pageClass}`).each(function(e) {
                let offset = $(this).offset();
                let p_offset = $(this).parent().offset();
                offset.top -= p_offset.top;

                let page_y0 = Math.min(Math.max(offset.top, 0), height);
                let page_y1 = Math.min(Math.max($(this).height() + offset.top, 0), height);
                let page_in = page_y1 - page_y0;

                if (page_in > page_in_max) {
                    currentPage = $(this);
                    page_in_max = page_in;
                }
            })            
            return currentPage;
        }

        /**
         * Function that updates the active page in the viewer and obtains its number
         */
        updateActivePage() {
            let $activepage = this.getCurrentPage();
            let activepage = $activepage.data('page');
            if (activepage !== this.currentPage) {
                this.currentPage = activepage;
                if (typeof this.settings.onActivePageChanged === 'function') {
                    this.settings.onActivePageChanged.call(this, $activepage);
                }
            }
        }

        /**
         * Function that renders one page in a div (calculating the resolution and the size of the page)
         * @param {*} page the pdfjs page object
         * @param {number} i the number of the page
         * @returns {*} a promise that will return the div that contains the page
         */
        __renderPage(page, i) {
            // TODO: review the target resolution, because at this time, the resulting div will have the size of the page in points (e.g a PDF is 800 points wide, the
            //       div will have the size of the page in pixels); but the real size of the page is the desired size (it is available for zooming). Revise whether it
            //       has sense or not, according to the zoom levels (now I think that it has sense, but I have the doubt)

            // Prepare a canvas to render the image
            let $canvas = $('<canvas></canvas>');
            let canvas = $canvas.get(0);

            // Calculate the scale to render the page, according to the settings of the users
            let scale = 4;
            var viewport = page.getViewport({scale:1});
            let h_ratio = this.settings.pageResolution.height / viewport.height;
            let w_ratio = this.settings.pageResolution.width / viewport.width;
            scale = Math.max(h_ratio, w_ratio);
            
            // Render the page, using the scale
            viewport = page.getViewport({scale: scale});
            var context = canvas.getContext('2d');

            // TODO: Calculate the pixel ratio of the device
            // let pixel_ratio =  Math.max(window.devicePixelRatio || 1, 1);
            let pixel_ratio = 1;

            // Create the holding div, with some parameters
            let $div = $(`<div id="page-${i}" data-page="${i}" data-scale="${scale}" data-width="${viewport.width / scale}" data-height="${viewport.height /scale}"></div>`).addClass(this.settings.pageClass).append($(canvas));

            // Prepare the div and canvas to hold the rendered page
            $div.height(viewport.height);
            $div.width(viewport.width);
            canvas.height = viewport.height * pixel_ratio;
            canvas.width = viewport.width * pixel_ratio;
            canvas.getContext("2d").scale(pixel_ratio, pixel_ratio);

            var renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            // Render the page
            return page.render(renderContext).promise.then(function() {
                // Resize the div to the size of the page
                $div.width($div.width() / scale).height($div.height() / scale)
                this.pages[i] = $div;
                return this.pages[i];
            }.bind(this));
        }

        /**
         * Returns the number of pages of the pdf document
         * @returns number of pages
         */
        getPageCount() {
            if (this.pdf === null)
                return 0;
            return this.pdf.numPages;
        }

        /**
         * Gets the page number of the page that is currently active in the viewer, as being update with updateActivePage.
         *   This function is called during the scroll
         * @returns the number of the page that is currently active in the viewer
         */
        getCurrentPageno() {
            return this.currentPage;
        }

        /**
         * Loads one page by its number
         * @param {number} i the number of the page to load
         * @returns {*} a promise to render the page that has been loaded 
         */
        __loadPage(i = 1) {
            if (this.pdf === null) 
                return false;
            if (i > this.pdf.numPages) {
                return false;
            }
            if (i < 1) {
                return false;
            }
            if (this.pages[i] !== undefined) {
                return new Promise(function() { return this.pages[i] }.bind(this));
            }
            
            return this.pdf.getPage(i).then(function(page) {
                return this.__renderPage(page, i);
            }.bind(this));
        }

        /**
         * Function that removes any page from the viewer and reders the error page (if provided a function)
         */
        __showErrorPage() {
            this.$container.find(`.${this.settings.pageClass}`).remove();
            if (typeof this.settings.errorPage === "function") {
                let $errorpage = this.settings.errorPage.call(this);
                this.$container.append($errorpage);
            }
        }

        /**
         * Function that inserts the page in the viewer, in the appropriate position (according to the page number)
         * @param {jQuery} page 
         * @returns 
         */
        __addPage(page) {
            // Check wether the page already exists or not
            let pageno = page.data('page');
            if (this.$container.find(`.${this.settings.pageClass}[data-page="${pageno}"]`).length > 0) {
                console.warning(`page ${pageno} already exists`);
                return;
            }

            // Pages are being added in order, but this methos makes sure that the page is placed wherever it needs to be placed
            let prevpageno = pageno - 1;
            let $prevpage = this.$container.find(`.${this.settings.pageClass}[data-page="${prevpageno}"]`);;
            while ((prevpageno > 1) && ($prevpage.length === 0)) {
                prevpageno--;
                $prevpage = this.$container.find(`.${this.settings.pageClass}[data-page="${prevpageno}"]`);
            }

            // If it is the first page, will be placed the first in the container; otherwise, it will be placed after the page before
            if ($prevpage.length === 0) {
                page.prependTo(this.$container);
            } else {
                $prevpage.after(page);
            }

            // As it is a new page, let's update the zoom for the page (so that it will have the data-zoom attribute)
            if (this.zoom !== null) {
                page.zoom(this.zoom.current);
            }

            // Now call the callback (if provided)
            if (typeof this.settings.onNewPage === 'function') {
                this.settings.onNewPage.call(this, page);
            }
        }
        
        /**
         * Loads the document from the specified URL
         * @param {*} the URL of the pdf file
         * @returns a promise to load the pdf file
         */
        async loadDocument(document) {
            // Now prepare a placeholder for the pages
            this.pages = [];

            // Remove all the pages
            this.$container.find(`.${this.settings.pageClass}`).remove();

            // Let's free the pdf file (if there was one before), and rely on the garbage collector to free the memory
            this.pdf = null;

            // Load the task and return the promise to load the document
            let loadingTask = pdfjsLib.getDocument(document);
            return loadingTask.promise.then(function(pdf) {
                this.pdf = pdf;
                this.lastPage = 0;
                this.currentPage = 0;
                return this.loadMorePages(true).then(function() {
                    this.updateActivePage();
                }.bind(this));
            }.bind(this)).catch(function(error) {
                this.__showErrorPage();
                console.log(error);
            }.bind(this));
        }

        /**
         * This function adjusts the placement of the viewer, according to the calculatePlacement function provided by the user
         *   * the default function makes the viewer to cover all the parent's area
         */
        adjustPlacement() {
            this.__resizeListener();
        }

        /** This function checks whether it is needed to load more pages or not, according to the current position of the
         *    scroll in the viewer: if the scroll position is the maximum, it will load the next page (if there is one)
         *  @param {boolean} force if true, will load the next page even if the scroll position is not the maximum
         *  @returns a promise to load the next page(s)
        */
        async loadMorePages(force = false) {
            // TODO: check whether the function has to deal with reentrance

            // If the document is not loaded, the promise will be rejected
            if (this.pdf === null) {
                return Promise.reject(`No document has been loaded`);
            }

            let wrapper = this.$container.get(0);
            let loadedPage = null;

            // If the scroll position is the maximum, load the next page (or if the loading is forced)
            if (force || (wrapper.offsetHeight + wrapper.scrollTop >= wrapper.scrollHeight)) {
                if (this.lastPage < this.pdf.numPages) {
                    this.lastPage++;
                    loadedPage = this.__loadPage(this.lastPage).then(function(page) {
                        // Once the page has been loaded, let's add it to the viewer and check whether have to load more pages
                        this.__addPage(page);
                        return this.loadMorePages().then(function(res) {
                            // If there is no more pages, simply return the just loaded page; otherwise, return the
                            //   promise to load the next page(s)
                            if (res === true) {
                                return page;
                            } else {
                                return res;
                            }
                        }).catch(error => console.log(error));
                    }.bind(this));
                }
            }

            // If there was no need to load more pages, simply resolve the promise to true
            if (loadedPage === null) {
                return true;
            } else {
                return loadedPage;
            }
        }

        /** Function that loads a page, using its page number, and scrolls to it
         *    - At the moment, the function loads all the pages up to the desired page number
         *    @param {number} pagei the page number to load
         */
        async gotoPage(pagei = -1) {
            if (this.pdf === null) {
                return Promise.reject(`No document has been loaded`);
            }

            // Adjust the page number to the available range
            if (pagei <= 0) {
                pagei = this.currentPage;
            }
            if (pagei > this.pdf.numPages) {
                pagei = this.pdf.numPages;
            }

            // If the page is not found, we'll load more pages until the page is there
            let $page = this.$container.find(`.${this.settings.pageClass}[data-page="${pagei}"`);
            let error = false;
            while (($page.length === 0) && (!error)) {
                await this.loadMorePages(true).catch(function() {
                    error = true;
                })
                $page = this.$container.find(`.${this.settings.pageClass}[data-page="${pagei}"`);
            }
            if (error) {
                console.error(`Error while going to page ${pagei}`);
                return null;
            }
            this.scrollToVisible($page);
            return $page;
        }
        
        /**
         * Sets the scroll of the container of pages to make that the specified page is visible
         * @param {jQuery} $page the page to put in top of the sroll
         */
        scrollToVisible($page) {
            if (($page === undefined) || ($page === null)) {
                return;
            }
            let position = $page.position();
            if (position !== undefined) {
                this.$container.get(0).scrollTop = this.$container.get(0).scrollTop + position.top;
            }
        }
        /**
         * Go to the next page
         */
        next() {
            this.gotoPage(this.currentPage + 1)
        }
        /**
         * Go to the previous page
         */
        prev() {
            this.gotoPage(this.currentPage - 1)
        }
        /**
         * Go to the first page
         */
        first() {
            this.gotoPage(1)
        }
        /**
         * Go to the last page
         */
        last() {
            this.gotoPage(this.pdf.numPages)
        }
        /**
         * Zooms in the whole PDF document
         */
        zoomIn() {
            if (this.zoom === null) {
                return false;
            }
            this.zoom.zoom(true);
        }
        /**
         * Zooms out the whole PDF document
         */
         zoomOut() {
            if (this.zoom === null) {
                return false;
            }
            this.zoom.zoom(false);
        }
        /**
         * Zooms in the whole PDF document to make that the active page fits the container in height
         */
         zoomHeight() {
            if (this.zoom === null) {
                return false;
            }
            this.zoom.apply('height');
        }
        /**
         * Zooms in the whole PDF document to make that the active page fits the container in width
         */
         zoomWidth() {
            if (this.zoom === null) {
                return false;
            }
            this.zoom.apply('width');
        }
        /**
         * Zooms in the whole PDF document to make that the active page fits the container in height and width
         */
         zoomFit() {
            if (this.zoom === null) {
                return false;
            }
            this.zoom.apply('fit');
        }
        /**
         * Obtains the zoom level
         * @returns {number} the current zoom level
         */
        getZoom() {
            if (this.zoom === null) {
                return 1;
            }
            return this.zoom.current;
        }
    }

    // Export the class
    exports.PDFjsViewer = PDFjsViewer;
})(window, jQuery)