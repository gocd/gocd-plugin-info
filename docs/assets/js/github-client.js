const GitHubClient = function () {
    const client = this;

    client.listRepos = function (organization, callback) {
        $.ajax({
            url: client.format("https://api.github.com/orgs/{0}/repos", [organization]),
            success: function (result) {
                callback(result);
            }
        });
    };

    client.listReleases = function (plugin, callback) {
        $.ajax({
            url: plugin.releases_url.replace("{/id}", ""),
            success: function (result) {
                callback(result);
            }
        });
    };

    client.format = function (source, params) {
        $.each(params, function (index, param) {
            source = source.replace(new RegExp("\\{" + index + "\\}", "g"), param);
        });
        return source;
    };

    return client;
};