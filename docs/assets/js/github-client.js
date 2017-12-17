const GitHubClient = function () {
    const client = this;

    client.listReleases = function (plugin, callback) {
        $.ajax({
            url: `api/${plugin.repository_name}/index.json`,
            success: function (result) {
                release_from_github(plugin, result, callback);
            }
        });
    };

    release_from_github = function (plugin, original_result, callback) {
        if (original_result.etag) {
            $.ajax({
                url: `https://api.github.com/repos/${plugin.repository_name}/releases`,
                beforeSend: function (request) {
                    request.setRequestHeader("If-None-Match", original_result.etag);
                },
                success: function (result, status, xhr) {
                    if (xhr.status === 200) {
                        callback(result);
                    } else {
                        callback(original_result.releases)
                    }
                }
            });
        } else {
            callback(original_result.releases);
        }
    };

    client.format = function (source, params) {
        $.each(params, function (index, param) {
            source = source.replace(new RegExp("\\{" + index + "\\}", "g"), param);
        });
        return source;
    };

    return client;
};