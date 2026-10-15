import { createServer } from 'node:http';
import { Server } from 'socket.io';

const port = Number(process.env.SOCKET_PORT ?? 3001);
const allowedOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3000';

const httpServer = createServer((request, response) => {
	if (request.url === '/healthz') {
		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(JSON.stringify({ status: 'ok' }));
		return;
	}

	response.writeHead(404);
	response.end('Not found');
});

const io = new Server(httpServer, {
	cors: { origin: allowedOrigin, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
	const publishActiveCount = () => io.emit('active-count', io.engine.clientsCount);

	// Keep every connected tab in sync
	publishActiveCount();
	socket.on('disconnect', publishActiveCount);
});

httpServer.listen(port, '0.0.0.0', () => {
	console.info(`Socket presence listening on port ${port}.`);
});

const shutdown = () => {
	io.close(() => {
		process.exit(0);
	});
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
