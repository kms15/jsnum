#./node_modules/requirejs/bin/r.js -o name=lib/almond.js include=src/jsnum-global.js out=body.js baseUrl=. && \
./runtests.js && \
    jslint *.js *.html src/*.js test/*.js && \
    jsdoc src/jsnum.js -d ../jsnum-doc/jsdoc && \
	./node_modules/requirejs/bin/r.js -o tools/require.js.build.config && \
    echo // http://kms15.github.com/jsnum/ built `date +%Y-%M-%dT%H:%mZ` > ../jsnum-doc/jsnum-0.0.js && \
    cat body.js >> ../jsnum-doc/jsnum-0.0.js && \
    rm body.js && \
    echo "####  Build Succeded! ####"