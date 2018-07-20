## GoCD plugin info

### Build 

#### 1. Install gems
```bash
cd docs
bundle install --path .bundle --binstubs
```

#### 2. Build site
```bash
bundle exec jekyll clean build --trace --incremental
```

#### 3. Serve locally
```bash
bundle exec jekyll serve --trace
```
