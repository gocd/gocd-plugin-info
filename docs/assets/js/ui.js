const UI = function (ignoreList) {
    const ui = this;
    const githubClient = new GitHubClient();

    ui.renderRegisteredPlugins = function (registeredPlugins) {
        $.each(registeredPlugins, function (index, category) {
            var categoryLi = $('<li class="list-group-item category-header">').text(category.type);
            categoryLi.appendTo(".plugin-listing");
            $.each(category.plugins, function (index, plugin) {
                if (plugin.releases_url && !plugin.paid) {
                    var pluginLi = $('<li class="list-group-item">').text(plugin.name);
                    pluginLi.appendTo(".plugin-listing");
                    ui.onPluginClick(pluginLi, plugin)
                }
            })
        })
    };

    ui.onPluginClick = function (elem, plugin) {
        elem.click(function () {
            $(".plugin-name").text(plugin.name);
            $(".list-group-item").removeClass("selected");
            elem.addClass("selected");

            githubClient.listReleases(plugin, function (releases) {
                ui.renderReleasesTableView(plugin, releases);
            });
        });
    };

    ui.renderReleasesTableView = function (plugin, releases) {
        $('.release-listing').html("");
        const table = $('<table class="table table-bordered">');
        const headerRow = $('<tr>');
        $('<thead>').append(headerRow).appendTo(table);
        $.each(["Name", "tag", "size", "Downloads", "Published At", "Author", ""], function (index, text) {
            $('<th scope="col">').text(text).appendTo(headerRow)
        });

        const tbody = $('<tbody>');
        table.append(tbody);
        if (releases.length == 0) {
            ui.errorCard("No release", `No release available for plugin <code>${plugin.full_name}</code>`).appendTo('.release-listing');
            return;
        }
        $.each(releases, function (index, release) {
            const row = $('<tr>');
            row.appendTo(tbody);
            if (release.name) {
                $('<td>').text(release.name).appendTo(row);
            } else {
                $('<td class="text-muted">').text("unnamed-release").appendTo(row);
            }

            $('<td>').html(`<span class="badge badge-success">${release.tag_name}</span>`).appendTo(row);
            $('<td>').text(release.assets[0] ? ui.readableSize(release.assets[0].size) : '').appendTo(row);
            $('<td>').text(release.assets[0] ? release.assets[0].download_count : '').appendTo(row);
            $('<td>').text(new Date(release.published_at).toLocaleDateString("en-US", {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })).appendTo(row);

            $('<td>').append(ui.authorInformation(release.author)).appendTo(row);
            if (release.assets[0]) {
                $('<td>').append(ui.downloadButton(release.assets[0].browser_download_url)).appendTo(row);
            } else {
                $('<td>').appendTo(row);
            }

            table.appendTo('.release-listing');
        });
    };

    ui.authorInformation = function (author) {
        const anchor = $(`<a href="${author.url}" style="text-decoration:none">`);
        anchor.append(`<img src="${author.avatar_url}" width="20" height="20" class="rounded" alt="${author.login}"/>`);
        anchor.append('&nbsp;&nbsp;');
        anchor.append(author.login);
        return anchor;
    };

    ui.downloadButton = function (downloadUrl) {
        return $('<a class="download-button text-info">')
            .text('Download')
            .attr('href', downloadUrl)
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