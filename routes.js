var plex = require("plex-api");
var config = require("./config");

var client = new plex(config.NAS_IP);

var createSemaphore = function(clb) {
    var wait = 0;

    return {
        wait: function() {
            wait = wait + 1;
        },
        done: function() {
            wait = wait - 1;

            if(wait === 0) {
                clb();
            }
        }
    };
};

exports.setup = function(application) {
    application.get("/", function(request, response) {
        response.render("./public/index.html");
    });

    application.get("/list", function(request, response) {
        var files = [];

        var semaphore = createSemaphore(function() {
            response.send(files);
        });

        client.find("/library/sections", {type: "movie" }, function(error, directories) {
            directories.forEach(function(directory) {
                client.query(directory.uri + "/all", function(error, section) {
                    section.video.forEach(function(movie) {
                        semaphore.wait();

                        client.query(movie.attributes.key, function(error, meta) {
                            meta.video.forEach(function(video) {
                                var title = video.attributes.title;
                                var year = video.attributes.year;

                                video.media.forEach(function(media) {
                                    var resolution = media.attributes.videoResolution;
                                    var frameRate = media.attributes.videoFrameRate;

                                    var streams = [];

                                    var count = false;
                                    var length;

                                    if(media.part.length > 1) {
                                        count = true;
                                        length = media.part.length;
                                    }

                                    media.part.forEach(function(part, index) {
                                        var original = part.attributes.file;

                                        var basePath = original.slice(0, original.lastIndexOf("/"));
                                        var extension = original.slice(original.lastIndexOf("."));

                                        part.stream.forEach(function(stream) {
                                            if(stream.attributes.streamType !== "2") {
                                                // No audio stream
                                                return;
                                            }

                                            var kind;
                                            if(stream.attributes.channels === "2") {
                                                kind = "stereo";
                                            } else if(stream.attributes.channels === "6") {
                                                kind = "5.1";
                                            }

                                            var codec = stream.attributes.codec;

                                            var streamId = (stream.attributes.languageCode || "unknown") +
                                                "-" +
                                                (codec === "dca" ? "dts" : codec) +
                                                (kind ? "-" + kind : "");

                                            if(streams.indexOf(streamId) >= 0) {
                                                return;
                                            }

                                            streams.push(streamId);
                                        });

                                        var filename = [
                                            title + (count ? " " + (index + 1) + " of " + length : ""),
                                            year,
                                            resolution + frameRate.slice(frameRate.length - 1),
                                            streams.sort().join(" ")
                                        ].join(" ") + extension;

                                        filename = filename.replace(/[\\/]/, " -");

                                        files.push({
                                            path: basePath,
                                            original: original.slice(original.lastIndexOf("/") + 1),
                                            renamed: filename
                                        });
                                    });
                                });
                            });

                            semaphore.done();
                        });
                    });
                });
            });
        });
    });
};
