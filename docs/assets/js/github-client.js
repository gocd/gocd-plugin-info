const GitHubClient = function () {
    const client = this;

    client.listReleases = function (plugin, callback) {
        ajax(`api/${plugin.repository_name}/index.json`, {}, function (result, status, xhr) {
            release_from_github(plugin, result, callback);
        });
    };

    release_from_github = function (plugin, original_result, callback) {
        if (original_result.etag) {
            ajax(`https://api.github.com/repos/${plugin.repository_name}/releases`,
                {"If-None-Match": original_result.etag}, function (result, status, xhr) {
                    if (xhr.status === 200) {
                        callback(result);
                    } else {
                        callback(original_result.releases)
                    }
                });
        } else {
            callback(original_result.releases);
        }
    };

    ajax = function (url, headers, callback) {
        $.ajax({
            url: url,
            headers: headers,
            beforeSend: function (request) {
                addSpinner();
            },
            success: function (result, status, xhr) {
                removeSpinner();
                callback(result, status, xhr);
            },
            error: function (xhr, status, errorThrown) {
                removeSpinner();
                callback(null, status, xhr);
            }
        });
    };

    addSpinner = function () {
        $('.release-listing').html('')
        $('.release-listing').prepend('<div class="loader"/>');
    };

    removeSpinner = function () {
        try {
            $(".loader").remove();
        } catch (e) {
            console.log(e);
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