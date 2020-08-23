#!/bin/bash

echo 'this is my script now'
bundle config force_ruby_platform true
BUNDLE_FORCE_RUBY_PLATFORM=true
# bundle exec jekyll serve -P 4000
bundle install
jekyll serve

