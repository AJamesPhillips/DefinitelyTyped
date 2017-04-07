import * as HapiES6 from 'hapi';
import * as InertES6 from 'inert';

const server = new HapiES6.Server({});
server.register(InertES6, () => {});

server.route({
    path: '',
    method: 'GET',
    file: {
        path: '',
        confine: true,
    },
    directory: {
        path: '',
        listing: true
    }
})

var fileHandler: HapiES6.IFileHandler = {
    path: '',
    confine: true,
}

var directoryHandler: HapiES6.IDirectoryHandler = {
    path: function(){
        if(Math.random() > 0.5) {
            return '';
        }
        else if(Math.random() > 0) {
            return [''];
        }
        return new Error('');
    },
    listing: true,
}

/* TODO fix these tests
server.route({
    method: 'GET',
    path: '/file',
    handler: function (request: HapiES6.Request, reply: HapiES6.IReply) {

        let path = 'plain.txt';
        if (request.headers['x-magic'] === 'sekret') {
            path = 'awesome.png';
        }

        return reply.file(path).vary('x-magic');
    }
});

server.ext('onPostHandler', function (request: HapiES6.Request, reply: HapiES6.IReply) {

    const response = request.response;
    if (response.isBoom &&
        response.output.statusCode === 404) {

        return reply.file('404.html').code(404);
    }

    return reply.continue();
});
*/