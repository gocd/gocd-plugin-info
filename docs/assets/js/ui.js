const UI = function (ignoreList) {
    const ui = this;
    const githubClient = new GitHubClient();

    ui.renderPluginList = function (orgs) {
        githubClient.listRepos(orgs, function (plugins) {
            $.each(plugins, function (index, plugin) {
                if (!ui.isInIgnoreList(plugin)) {
                    var pluginLi = $('<li class="list-group-item">').text(plugin.name);
                    pluginLi.appendTo(".plugin-listing");
                    ui.onPluginClick(pluginLi, plugin);
                }
            })
        });
    };

    ui.onPluginClick = function (elem, plugin) {
        elem.click(function () {
            ui.renderReleases(plugin);
        });
    };

    ui.renderReleases = function (plugin) {
        $('.release-listing').html("");
        githubClient.listReleases(plugin, function (releases) {
            if (releases.length == 0) {
                ui.errorCard("No release", `No release available for plugin <code>${plugin.full_name}</code>`).appendTo('.release-listing');
                return;
            }
            $.each(releases, function (index, release) {
                const releaseDiv = $('<div class="col-4 plugin-release cd">');
                if (release.name) {
                    $('<span class="name">').text(release.name).appendTo(releaseDiv);
                } else {
                    $('<span class="name text-muted">').text("unnamed-release").appendTo(releaseDiv);
                }

                releaseDiv.append(ui.createTag(release.tag_name));
                releaseDiv.append(ui.keyValueGroup("Size", ui.readableSize(release.assets[0].size), "btn-primary"));
                releaseDiv.append(ui.keyValueGroup("Downloads", release.assets[0].download_count, "btn-success"));

                const publishedDate = new Date(release.published_at);
                releaseDiv.append(ui.keyValueGroup("Published At", publishedDate.toLocaleDateString("en-US", {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })));

                const footer = $('<div class="cd-ft">');
                ui.downloadButton(release.assets[0].browser_download_url).appendTo(footer);
                footer.appendTo(releaseDiv);

                releaseDiv.appendTo('.release-listing');
            });
        });
    };

    ui.downloadButton = function (downloadUrl) {
        return $('<a class="download-button text-info">')
            .text('Download')
            .attr('href', downloadUrl)
    };

    ui.keyValueGroup = function (key, value, valueClass) {
        valueClass = valueClass || '';
        const downloadCountDiv = $('<div class="key-value">');
        $('<span class="key">').text(key).appendTo(downloadCountDiv);
        $('<span class=value btn btn-sm">').addClass(valueClass).text(value).appendTo(downloadCountDiv);
        return downloadCountDiv
    };

    ui.createTag = function (tagName) {
        const group = $('<span class="btn-group tag">');
        $('<span class="badge badge-dark tag-title">').text("tag").appendTo(group);
        $('<span class="badge badge-success tag-name">').text(tagName).appendTo(group);
        return group
    };

    ui.errorCard = function (header, message, cardClass) {
        const card = $('<div class="cd cd-error text-danger">');
        if (cardClass) {
            card.addClass(cardClass)
        }

        $('<div class="cd-title">').text(header).appendTo(card);
        $('<p class="cd-content">').html(message).appendTo(card);

        return card;
    };

    ui.isInIgnoreList = function (plugin) {
        if (ignoreList) {
            for (let i = 0; i < ignoreList.length; i++) {
                if (new RegExp(ignoreList[i]).test(plugin.name)) {
                    return true;
                }
            }
        }
        return false;
    };

    ui.readableSize = function (bytes) {
        const thresh = 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    };

    return ui;
};