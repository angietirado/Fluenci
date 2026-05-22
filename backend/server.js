const colors = require('colors');
const app = require('./app');

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(
            `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold
        );
    });

    process.on('unhandledRejection', (err) => {
        console.log(`Error: ${err?.message || 'Unhandled Promise Rejection'}`.red);
        server.close(() => process.exit(1));
    });
}
