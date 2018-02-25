require 'json'
require 'open-uri'
require 'fileutils'
require 'faraday'

@client = Faraday.new(:url => "https://api.github.com/repos")
@warnings = [];
@ignore_list = %w(amis.yml events.yml paid_plugins.yml tag_page_header_info.yml webinars.yml workshops_presentations.yml)
Jekyll::Hooks.register :site, :post_write do |site|
  @warnings = [];
  @site = site
  File.write '_data/releases.json', open('https://download.gocd.org/releases.json').read
  file = File.read('_data/gocd-plugins-list.json')

  plugins_store = []
  JSON.parse(file).each do |entry|
    if not @ignore_list.include? entry['name']
      category = {
          type: File.basename(entry['name'], '.*'),
          plugins: JSON.parse(download_yaml_file(entry['download_url']).to_json)
      }
      plugins_store << category
    end
  end

  download_release_information plugins_store

  File.open('api/registered-plugins.json', 'w') do |file|
    file.write(plugins_store.to_json)
  end

  puts ""
  puts "====================== Warnings ======================"
  @warnings.each do |warning|
    puts warning
  end
  puts "======================================================"
end

def download_yaml_file fromURL
  YAML::load(open(fromURL))
end

def download_release_information(plugins_store)
  FileUtils.mkdir_p("api/")
  threads = []
  plugins_store.each do |category|
    plugins_to_delete = []
    category[:plugins].each do |plugin|
      if github_url(plugin['releases_url'])
        repo_url = github_repo_url(plugin['releases_url'])
        plugin['repository_name'] = repo_url
        threads << Thread.new {get_releases(repo_url)}
      else
        puts "Unable to find valid release url for #{plugin['name']}"
        plugins_to_delete << plugin
      end
    end

    plugins_to_delete.each do |plugin|
      category[:plugins].delete(plugin)
    end
  end

  puts "--> Total thread count #{threads.length}\n\n"
  threads.each {|thr| thr.join}
end

def github_url url
  return !url.nil? && url.match(/\Ahttps:\/\/github.com\/\S*\/\S*\/releases\/{0,1}$/)
end

def github_repo_url url
  (url.match(/\Ahttps:\/\/github.com\/(\S*\/\S*)\/releases\/{0,1}$/).captures)[0]
end

def write_releases_to_file(directory, releases)
  FileUtils.mkdir_p(directory)
  File.open("#{directory}/index.json", 'w') do |file|
    file.write(releases)
  end
end

def get_etag(directory)
  begin
    JSON.parse(File.read("#{directory}/index.json"))["etag"]
  rescue
    ""
  end
end

def authorize_request(req)
  if !@site.data['dev'].nil? && !@site.data['dev']['token'].nil?
    req.headers['Authorization'] = "token #{@site.data['dev']['token']}"
  end
end

def get_releases(repo_url)
  directory = "api/#{repo_url}/"
  begin
    response = @client.get do |req|
      req.url "#{repo_url}/releases?per_page=50"
      authorize_request(req)
      req.headers['If-None-Match'] = get_etag(directory)
    end

    if response.status == 200
      puts "Updating #{repo_url}"
      write_releases_to_file(directory, {:releases => JSON.parse(response.body), :etag => response.headers["ETag"].gsub("W/", "")}.to_json)
    else
      puts "#{repo_url} --- Skipping(#{response.status})"
    end
  rescue
    @warnings << "Error while fetching release info #{repo_url}"
  end
end