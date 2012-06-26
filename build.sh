#./node_modules/requirejs/bin/r.js -o name=lib/almond.js include=src/jsnum-global.js out=body.js baseUrl=. && \
./runtests.js && \
    jslint *.js *.html src/*.js test/*.js && \
    rm -rf ../jsnum-doc/mudoc && mkdir ../jsnum-doc/mudoc && \
    tools/mudoc.js src/*.js ../jsnum-doc/mudoc && \
	./node_modules/requirejs/bin/r.js -o tools/require.js.build.config && \
    echo // http://kms15.github.com/jsnum/ built `date +%Y-%m-%dT%H:%MZ` > ../jsnum-doc/jsnum-0.0.js && \
    cat body.js >> ../jsnum-doc/jsnum-0.0.js && \
    rm body.js && \
    echo "####  Build Succeded! ####"
