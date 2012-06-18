/**
 * DocGen: a simple documentation generator
 *
 * copyright (c) Kendrick Shaw 2012
 */

var fs = require('fs'),
    inputFiles = process.argv.slice(2, -1),
    outputDir = fs.realpathSync(process.argv.slice(-1)[0]),
    i,
    inFile, text,
    outFiles = {}, outFilename, outFile,
    comments = {};

function normalizeFilename(filename) {
    // return filename.match(/[^\/]*$/)[0].replace(/\./g, '_') + '.html';
    return filename.replace(/\//g, "-").replace(/\./g, '_');
}


function padLeft(text, length) {
    text += '';
    while (text.length < length) {
        text = ' ' + text;
    }

    return text.replace(/ /g, '&nbsp');
}
var commentOpenDelim = "/**",
    commentCloseDelim = "*/";

function parseComment(filename, lineNum, text) {
    var lines, title, lead, body, id, match;

    lines = text.slice(commentOpenDelim.length, -commentCloseDelim.length).
        replace(/^[ \t]*\*/gm, "").split("\n");
    title = lines[0].replace(/^ */, "").replace(/ *$/, "");
    lead = lines[1].replace(/^ */, "").replace(/ *$/, "");
    body = lines.slice(2);
    match = title.match(/([A-Za-z0-9]+\.)*([A-Za-z0-9]+)/);

    if (match) {
        id = match[0].replace(/\./g, '-');
    } else {
        id = "comment-" + normalizeFilename(filename) + "-" + lineNum;
    }

    return {
        type: "comment",
        filename: filename,
        lineNum: lineNum,
        title: title,
        lead: lead,
        body: body,
        id: id,
        text: text
    };
}

function parseFile(filename, text) {
    var result = [],
        codeStart = 0,
        commentStart,
        lineNum = 1,
        textBlock;

        do {
            commentStart = text.indexOf(commentOpenDelim, codeStart);

            if (commentStart === -1) {
                commentStart = text.length;
            }
            textBlock = text.slice(codeStart, commentStart);
            result.push({
                type: "code",
                filename: filename,
                lineNum: lineNum,
                text: textBlock
            });

            lineNum += textBlock.split('\n').length - 1;

            if (commentStart !== text.length) {
                codeStart = text.indexOf(commentCloseDelim, commentStart);

                if (codeStart === -1) {
                    throw new SyntaxError("Comment opened but never closed!");
                }
                codeStart += commentCloseDelim.length;

                textBlock = text.slice(commentStart, codeStart);
                result.push(parseComment(filename, lineNum, textBlock));
                lineNum += textBlock.split('\n').length - 1;
            }
        } while (commentStart != text.length);

        return result;
}

function sanitizeCode(text) {
    return text.replace(/ /g, '&nbsp;').replace(/</g, '&lt;').
        replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}
/*
function annotateCode(filename, text, outFiles) {
    var lines = text.split('\n'),
        i, result = "",
        linenumWidth = Math.ceil(Math.log(lines.length) / Math.log(10));
    result += "<!DOCTYPE html>\n";
    result += "<html>\n";
    result += "<head><title>" + filename + "</title></head>\n";
    result += "<body><code>\n";
    for (i = 0; i < lines.length; i += 1) {
        result += padLeft(i + 1, linenumWidth) + padLeft("", 4) + sanitizeCode(lines[i] + "\n");
    }
    result += "</code></body>\n";
    result += "</html>\n";

    outFiles[normalizeFilename(filename) + ".html"] = result;
}
*/
function generateAnnotatedCode(parsedFile, outFiles) {
    var i, j, result = "", lines, docTagOpen, docTagClose = '</a>',
        linenumWidth = 6;//Math.ceil(Math.log(lines.length) / Math.log(10));
    result += "<!DOCTYPE html>\n";
    result += "<html>\n";
    result += "<head>\n";
    result += "<title>" + parsedFile[0].filename + "</title>\n";
    result += '<link rel="stylesheet" type="text/css" href="docgen.css"/>\n';
    result += "</head>\n";
    result += '<body class="sourceCodeListingPage">\n';
    result += "<h1>" + parsedFile[0].filename + "</h1>";
    result += "<code>\n";
    for (i = 0; i < parsedFile.length; i += 1) {
        // add links from comment to parsed version in index.html
        if (parsedFile[i].type == "comment") {
            result += '<span id="' + parsedFile[i].id + '" class="docTag"/>';
            docTagOpen = '<a href="index.html#' + parsedFile[i].id + '">';
            result += docTagOpen;
        }
        lines = parsedFile[i].text.split('\n');
        for (j = 0; j < lines.length; ++j) {
            if (parsedFile[i].type == "comment") {
                result += docTagClose;
            }
            if (i === 0 || j !== 0) { // if this is a new line
                result += "<br/>\n" + padLeft(parsedFile[i].lineNum + j,
                    linenumWidth) + padLeft("", 4);
            }
            if (parsedFile[i].type == "comment") {
                result += docTagOpen;
            }
            result += sanitizeCode(lines[j]);
        }
        // close the link
        if (parsedFile[i].type == "comment") {
            result += docTagClose + '<span/>';
        }
    }
    result += "\n</code></body>\n";
    result += "</html>\n";

    outFiles[normalizeFilename(parsedFile[0].filename) + ".html"] = result;
}

for (i = 0; i < inputFiles.length; i += 1) {
    inFile = fs.openSync(inputFiles[i], 'r');
    text = fs.readSync(inFile, 100000000, null, "utf-8")[0];
    fs.closeSync(inFile);


    var parsedFile = parseFile(inputFiles[i], text);
    generateAnnotatedCode(parsedFile, outFiles);
    //console.log(parsedFile);
}
outFiles["docgen.css"] =
    ".sourceCodeListingPage {\n" +
    "    width: 800px;\n" +
    "    margin: 0 auto;\n" +
    "}\n" +
    ".docTag a {\n" +
    "    text-decoration: none;\n" +
    "    color: #202080;\n" +
    "}\n" +
    ".docTag a:hover {\n" +
    "    text-decoration: none;\n" +
    "    color: #5050F0;\n" +
    "}\n";



for (outFilename in outFiles) {
    if (outFiles.hasOwnProperty(outFilename)) {
        outFile = fs.openSync(outputDir + '/' + outFilename, 'w');
        fs.writeSync(outFile, outFiles[outFilename], null);
        fs.closeSync(outFile);
    }
}
