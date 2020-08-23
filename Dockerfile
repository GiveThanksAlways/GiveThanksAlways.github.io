FROM jekyll/builder:latest


# RUN bundle config force_ruby_platform true
# RUN BUNDLE_FORCE_RUBY_PLATFORM=true
# RUN gem install sassc --platform RUBY
# RUN bundle install
ENV BUNDLE_FORCE_RUBY_PLATFORM true
WORKDIR /srv/jekyll
ENTRYPOINT bash serve.sh

# ENTRYPOINT jekyll build
# ENTRYPOINT bundle exec jekyll serve -P 4000