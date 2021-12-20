current_dir = $(notdir $(shell pwd))
build:
ifneq ("","$(wildcard js/*.js)")
	uglifyjs js/*.js $(UGLIFY_FLAGS) -b | cat notice - > $(current_dir).js
	uglifyjs js/*.js $(UGLIFY_FLAGS_MIN) | cat notice.min - > $(current_dir).min.js
endif
ifneq ("","$(wildcard css/*.css)")
	cleancss css/*.css --format beautify | cat notice - > $(current_dir).css
	cleancss css/*.css | cat notice.min - > $(current_dir).min.css
endif

clean:
	rm -f $(current_dir).min.js $(current_dir).min.css $(current_dir).js $(current_dir).css
