#!/usr/bin/node
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
    match = title.match(/^([A-Za-z0-9]+\.)*([A-Za-z0-9]+)/);

    if (match) {
        id = match[0];
        htmlId = id.replace(/\./g, '-');
    } else {
        htmlId = id = "comment-" + normalizeFilename(filename) + "-" + lineNum;
    }

    return {
        type: "comment",
        filename: filename,
        lineNum: lineNum,
        title: title,
        lead: lead,
        body: body,
        id: id,
        htmlId: htmlId,
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
    return text.replace(/ (?= )/g, '&nbsp;').replace(/</g, '&lt;').
        replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

function caseInsensitiveCompare(a, b) {
    var al = a.toLowerCase(),
        bl = b.toLowerCase();

    if (al > bl) {
        return 1;
    }
    if (bl > al) {
        return -1;
    }
    return 0;
}

function generateAnnotatedCode(parsedFile, outFiles) {
    var i, j, result = "", lines, docTagOpen, docTagClose = '</a>',
        linenumWidth = 6;//Math.ceil(Math.log(lines.length) / Math.log(10));
    result += "<!DOCTYPE html>\n";
    result += "<html>\n";
    result += "<head>\n";
    result += "<title>" + parsedFile[0].filename + "</title>\n";
    result += '<link rel="stylesheet" type="text/css" href="docgen.css"/>\n';
    result += "</head>\n";
    result += '<body class="sourceCodeListingPage"><div class="mainColumn">\n';
    result += "<h1>" + parsedFile[0].filename + "</h1>";
    result += "<code>\n";
    for (i = 0; i < parsedFile.length; i += 1) {
        // add links from comment to parsed version in index.html
        if (parsedFile[i].type == "comment") {
            docTagOpen = '<a  id="' + parsedFile[i].htmlId +
                '" class="docTag" href="index.html#' + parsedFile[i].htmlId +
                '">';
            result += docTagOpen;
        }
        lines = parsedFile[i].text.split('\n');
        for (j = 0; j < lines.length; ++j) {
            if (i === 0 || j !== 0) { // if this is a new line
                result += '<br/><span class="lineNum">\n' + padLeft(parsedFile[i].lineNum + j,
                    linenumWidth) + "</span>" + padLeft("", 4);
            }
            result += sanitizeCode(lines[j]);
        }
        // close the link
        if (parsedFile[i].type == "comment") {
            //result += docTagClose + '<span/>';
            result += docTagClose;
        }
    }
    result += "\n</code></div></body>\n";
    result += "</html>\n";

    outFiles[normalizeFilename(parsedFile[0].filename) + ".html"] = result;
}


function createIdHierarchy(parsedFiles) {
    var nameHash = {}, hierarchyRoot = {}, i, name;

    for (i = 0; i < parsedFiles.length; i += 1) {
        if (parsedFiles[i].type == "comment") {
            if (nameHash[parsedFiles[i].id] !== undefined) {
                console.log("Duplicate name " + parsedFiles[i].id +
                    " found at " + nameHash[parsedFiles[i].id].filename + ":" +
                    nameHash[parsedFiles[i].id].lineNum + " and " +
                    parsedFiles[i].filename + ":" + parsedFiles[i].lineNum +
                    "\nDocument generation aborted.\n");
                process.exit(1);
            }

            nameHash[parsedFiles[i].id] = parsedFiles[i];
        }
    }

    function createNode(name) {
        var newNode, newNodeId, depth = 0, node = hierarchyRoot,
            ids=name.split('.');

        while (depth < ids.length) {
            newNode = node.children && node.children[ids[depth]];

            if (!newNode) {
                newNodeId = ids.slice(0,depth + 1).join('.');
                newNode = nameHash[newNodeId];

                if (newNode !== undefined) {
                    delete nameHash[newNodeId];
                } else {
                    newNode = {
                        id : newNodeId,
                        htmlId : newNodeId.replace('.', '-'),
                        title : newNodeId
                    }
                }
                node.children = node.children || {};

                node.children[ids[depth]] = newNode;
            }

            node = newNode;
            depth += 1;
        }
    }

    for (name in nameHash) {
        if (nameHash.hasOwnProperty(name)) {
            createNode(name);
        }
    }

    return hierarchyRoot;
}

if (Object.prototype.keys === undefined) {
    Object.prototype.keys = function () {
        var key, result = [];

        for (key in this) {
            if (this.hasOwnProperty(key)) {
                result.push(key);
            }
        }

        return result;
    }
}

function htmlForNode(node) {
    var result = "", childNames, i, splitId, prefix, title,
        zeroWidthSpace = "&#8203;";

    childNames = node.children && node.children.keys().
        sort(caseInsensitiveCompare);

    if (node.id) {
        result += '<div id="' + node.htmlId + '" class="' +
            (childNames ? "namespaceNode" : "namespaceLeaf") +
            '">\n';
        if (node.filename !== undefined) {
            result += '<a class="sourceLink" href="' +
                    normalizeFilename(node.filename) + '.html#' +
                    node.htmlId + '">' +
                    node.filename + ':' + node.lineNum +
                    '</a>\n';
        }
        splitId = node.id.split('.');
        prefix = splitId.slice(0, splitId.length - 1).join('.');
        title = '<span class="namespacePrefix">';
        for (i = 0; i < splitId.length - 1; i += 1) {
            title += '<a href="#' + splitId.slice(0, i + 1).join('-') + '">' +
                splitId[i] + zeroWidthSpace + '</a>.';
        }
        title += '</span>' +
            node.title.slice(prefix.length > 0 ? prefix.length + 1 : 0);
        if (childNames) {
            result += '<h2 class="functionTitle">' + title + '</h2>\n';
        } else {
            result += '<h3 class="functionTitle">' + title + '</h3>\n';
        }
    }

    if (childNames) {
        if (node.lead) {
            result += '<p>' + node.lead + '</p>\n';
        }
        result += '<div classname="memberList"><h3>Members</h3><dl>\n';
            for (i = 0; i < childNames.length; i += 1) {
                result += '<dt>' + '<a href="#' +
                node.children[childNames[i]].htmlId + '">' +
                childNames[i] + '</a></dt><dd>' +
                node.children[childNames[i]].lead + '</dd>\n';
            }
        result += '</dl></div>\n';
        if (node.lead) {
            result += '<h3>Description</h3>\n';
        }
    }

    if (node.lead) {
        result += '<p>' + node.lead;
        for (i = 0; i < node.body.length; i += 1) {
            if (node.body[i] === '') {
                // blank lines separate paragraphs
                result += '</p>\n<p>';
            }
            result += node.body[i];
        }
        result += '</p>\n';
    }

    // first leaf children, then node children
    if (childNames) {
        for (i = 0; i < childNames.length; i += 1) {
            if (node.children[childNames[i]].children === undefined) {
                result += htmlForNode(node.children[childNames[i]]);
            }
        }
        for (i = 0; i < childNames.length; i += 1) {
            if (node.children[childNames[i]].children !== undefined) {
                result += htmlForNode(node.children[childNames[i]]);
            }
        }
    }

    if (node.id) {
        result += '</div>\n';
    }

    return result;
}

function indexHtmlForNode(node) {
    var ids = node.id.split('.'), name = ids[ids.length - 1], result,
        childNames, i;

    childNames = node.children && node.children.keys().
        sort(caseInsensitiveCompare);


    if (childNames) {
        result = '<li class="indexNode"><a href="#' + node.htmlId + '">' +
            name + '</a>';
        result += '<ul>\n';
        // first leaf children, then node children
        for (i = 0; i < childNames.length; i += 1) {
            if (node.children[childNames[i]].children === undefined) {
                result += indexHtmlForNode(node.children[childNames[i]]);
            }
        }
        for (i = 0; i < childNames.length; i += 1) {
            if (node.children[childNames[i]].children !== undefined) {
                result += indexHtmlForNode(node.children[childNames[i]]);
            }
        }
        result += '</ul></li>\n';
    } else {
        result = '<li class="indexLeaf"><a href="#' + node.htmlId + '">' +
            name + '</a></li>\n';
    }

    return result;
}

function generateIndex(idHierarchy, outFiles) {
    var i, j, result = "", lines, docTagOpen, docTagClose = '</a>',
        title, childNames;

    childNames = idHierarchy.children && idHierarchy.children.keys().
        sort(caseInsensitiveCompare);
    if (childNames === undefined) {
        title = "Empty Documentation";
    } else if (childNames.length === 1) {
        title = "Documentation for the " +
            idHierarchy.children[childNames[0]].title +
            " library";
    } else {
        title = "Documentation for the ";
        for (i = 0; i < childNames.length - 2; i += 1) {
            title += idHierarchy.children[childNames[i]].title + ", ";
        }
        title +=
            idHierarchy.children[childNames[childNames.length - 2]].title +
            " and " +
            idHierarchy.children[childNames[childNames.length - 1]].title +
            " libraries";
    }
    result += "<!DOCTYPE html>\n";
    result += "<html>\n";
    result += "<head>\n";
    result += "<title>" + title + "</title>\n";
    result += '<link rel="stylesheet" type="text/css" href="docgen.css"/>\n';
    result += "</head>\n";
    result += '<body class="documentationIndexPage">\n';
    result += '<div class="mainColumn">\n';
    result += "<h1>" + title + "</h1>\n";
    if (childNames) {
        result += '<div class="namespaceIndex">\n';
        result += '<h2>Contents</h2>\n'
        result += '<ul>\n';
        for (i = 0; i < childNames.length; i += 1) {
            result += indexHtmlForNode(idHierarchy.children[childNames[i]]);
        }
        result += '</ul>\n';
        result += '</div>\n';
    }
    if (childNames) {
        for (i = 0; i < childNames.length; i += 1) {
            result += htmlForNode(idHierarchy.children[childNames[i]]);
        }
    }
    result += "\n<div>";
    result += '<script type="text/javascript" ' +
        'src="http://cdn.mathjax.org/mathjax/latest/MathJax.js' +
        '?config=TeX-MML-AM_HTMLorMML"></script>';
    result += "</body>\n";
    result += "</html>\n";

    outFiles["index.html"] = result;
}
var parsedFiles = [], idHierarchy;

for (i = 0; i < inputFiles.length; i += 1) {
    inFile = fs.openSync(inputFiles[i], 'r');
    text = fs.readSync(inFile, 100000000, null, "utf-8")[0];
    fs.closeSync(inFile);


    var parsedFile = parseFile(inputFiles[i], text);
    generateAnnotatedCode(parsedFile, outFiles);
    parsedFiles = parsedFiles.concat(parsedFile);
    //console.log(parsedFile);
}
idHierarchy = createIdHierarchy(parsedFiles);
//console.log(idHierarchy);
generateIndex(idHierarchy, outFiles);

outFiles["docgen.css"] =
    '.documentationIndexPage {\n' +
    '}\n' +
    '.sourceCodeListingPage {\n' +
    '}\n' +
    'body {\n' +
    '    background-color: #506080;\n' +
    '    background-image: -webkit-linear-gradient(-2deg, #607090, #506080 200px, #202040 1500px, #101020);\n' +
    '    background-image: -moz-linear-gradient(-2deg, #607090, #506080 200px, #202040 1500px, #101020);\n' +
    '    background-image: -ms-linear-gradient(-2deg, #607090, #506080 200px, #202040 1500px, #101020);\n' +
    '    background-image: -o-linear-gradient(-2deg, #607090, #506080 200px, #202040 1500px, #101020);\n' +
    '    background-image: linear-gradient(-2deg, #607090, #506080 200px, #202040 1500px, #101020);\n' +
    '    background-position: center;\n' +
    '    padding-top: 20px;\n' +
    '    padding-bottom: 20px;\n' +
    '}\n' +
    '.mainColumn {\n' +
    '    max-width: 800px;\n' +
    '    min-width: 300px;\n' +
    '    margin: 0px auto;\n' +
    '    background-color: white;\n' +
    '    background-image: -webkit-linear-gradient(0deg, #FFFFF8, #FCFCFC 70%, #F8F8FF);\n' +
    '    background-image: -moz-linear-gradient(0deg, #FFFFF8, #FCFCFC 70%, #F8F8FF);\n' +
    '    background-image: -ms-linear-gradient(0deg, #FFFFF8, #FCFCFC 70%, #F8F8FF);\n' +
    '    background-image: -o-linear-gradient(0deg, #FFFFF8, #FCFCFC 70%, #F8F8FF);\n' +
    '    background-image: linear-gradient(0deg, #FFFFF8, #FCFCFC 70%, #F8F8FF);\n' +
    '    padding-left: 40px;\n' +
    '    padding-right: 40px;\n' +
    '    padding-top: 20px;\n' +
    '    padding-bottom: 60px;\n' +
    '}\n' +
    '.sourceCodeListingPage .mainColumn {\n' +
    '    font-size: 0.8em;\n' +
    '    width: 800px;\n' +
    '}\n' +
    'h1, h2, h3, h4, h5, h6 {\n' +
    '    font-family: "Palatino Linotype", "Palatino", "URW Palladio L", serif;\n' +
    '}\n' +
    'h1 {\n' +
    '    border-bottom: 2px #808080 solid;\n' +
    '    padding-bottom: 5px;\n' +
    '    margin-bottom: 30px;\n' +
    '}\n' +
    'h2 {\n' +
    '    font-weight: bold;\n' +
    '    font-size: 1.3em;\n' +
    '    margin-top: 40px;\n' +
    '    margin-bottom: 10px;\n' +
    '    padding-bottom: 0px;\n' +
    '}\n' +
    '.namespaceNode > h2 {\n' +
    '    border-bottom: 2px #808080 solid;\n' +
    '}\n' +
    '.functionTitle .namespacePrefix, .functionTitle .namespacePrefix a {\n' +
    '    color: #888;\n' +
    '}\n' +
    '.functionTitle .namespacePrefix a:hover {\n' +
    '    color: #000080;\n' +
    '}\n' +
    'h3 {\n' +
    '    margin-left: 20px;\n' +
    '    margin-bottom: 10px;\n' +
    '    padding-bottom: 0px;\n' +
    '}\n' +
    'h3.functionTitle {\n' +
    '    margin-top: 30px;\n' +
    '}\n' +
    '.namespaceLeaf h3 {\n' +
    '    margin-left: 20px;\n' +
    '}\n' +
    'p {\n' +
    '    margin-left: 20px;\n' +
    '    margin-right: 20px;\n' +
    '    margin-top: 5px;\n' +
    '    padding-top: 0px;\n' +
    '    margin-bottom: 8px;\n' +
    '    padding-bottom: 0px;\n' +
    '    -webkit-hyphens: auto;\n' +
    '    -moz-hyphens: auto;\n' +
    '    -ms-hyphens: auto;\n' +
    '    -o-hyphens: auto;\n' +
    '    hyphens: auto;\n' +
    '    text-align: justify;\n' +
    '}\n' +
    '.namespaceLeaf p {\n' +
    '    margin-left: 40px;\n' +
    '}\n' +
    'dl {\n' +
    '    margin-top: 0px;\n' +
    '    padding-top: 0px;\n' +
    '}\n' +
    'dt, dd, p, li {\n' +
    '    font-family: "Linux Libertine O", Times, "Times New Roman", serif;\n' +
    '}\n' +
    'dt {\n' +
    '    font-weight: bold;\n' +
    '    margin-left: 40px;\n' +
    '}\n' +
    'dd {\n' +
    '    margin-left: 60px;\n' +
    '}\n' +
    'li.indexLeaf {\n' +
    '    display: inline;\n' +
    '    padding: 0;\n' +
    '    margin: 0;\n' +
    '    padding-right: 10px;\n' +
    '}\n' +
    'li.indexNode {\n' +
    '    display: block;\n' +
    '    padding: 0;\n' +
    '    margin: 0;\n' +
    '}\n' +
    'ul, ol {\n' +
    '    padding: 0 0 0 20px;\n' +
    '    margin: 0;\n' +
    '}\n' +
    'a {\n' +
    '    text-decoration: none;\n' +
    '}\n' +
    'a:hover {\n' +
    '    color: #F00080;\n' +
    '}\n' +
    '.docTag {\n' +
    '    text-decoration: none;\n' +
    '    color: #2020F0;\n' +
    '}\n' +
    '.docTag:hover {\n' +
    '    text-decoration: none;\n' +
    '    color: #F00080;\n' +
    '}\n' +
    '.sourceLink {\n' +
    '    font-size: 1em;\n' +
    '    font-weight: normal;\n' +
    '    font-family: "Linux Libertine O", Times, "Times New Roman", serif;\n' +
    '    margin-left: 20px;\n' +
    '    margin-right: 20px;\n' +
    '    float: right;\n' +
    '}\n' +
    '.lineNum {\n' +
    '    color: #808080;\n' +
    '}\n' +
    'code {\n' +
    '    font-family: "DejaVu Sans Mono", "Andale Mono", Consolas, monospace;\n' +
    '}\n' +
    '\n';


for (outFilename in outFiles) {
    if (outFiles.hasOwnProperty(outFilename)) {
        outFile = fs.openSync(outputDir + '/' + outFilename, 'w');
        fs.writeSync(outFile, outFiles[outFilename], null);
        fs.closeSync(outFile);
    }
}
