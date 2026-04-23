const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'OrangeRed Massage API',
            version: '1.0.0',
            description: 'API documentation for OrangeRed massage booking platform',
        },
        servers: [
            { url: 'http://localhost:5000', description: 'Local' },
            { url: 'https://orange-red-phi.vercel.app', description: 'Production' },
            { url: 'https://backend.app', description: 'Docker' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        tel: { type: 'string' },
                        role: { type: 'string', enum: ['user', 'shopowner', 'admin'] },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        profilePicture: { type: 'string', nullable: true },
                    },
                },
                Shop: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                district: { type: 'string' },
                                province: { type: 'string' },
                                postalcode: { type: 'string' },
                            },
                        },
                        tel: { type: 'string' },
                        owner: { type: 'string' },
                        openClose: {
                            type: 'object',
                            properties: {
                                open: { type: 'string', example: '09:00' },
                                close: { type: 'string', example: '21:00' },
                            },
                        },
                        picture: { type: 'string' },
                        shopDescription: { type: 'string' },
                        averageRating: { type: 'number' },
                        ratingCount: { type: 'number' },
                        massageType: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    price: { type: 'number' },
                                    picture: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                Reservation: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        Shop: { type: 'string' },
                        reservationDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['active', 'past', 'cancelled'] },
                    },
                },
                Message: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        room: { type: 'string', example: '<shopId>_<userId>' },
                        user: { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' }, profilePicture: { type: 'string' } } },
                        text: { type: 'string' },
                        deleted: { type: 'boolean' },
                        editedAt: { type: 'string', format: 'date-time', nullable: true },
                        history: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, editedAt: { type: 'string' } } } },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Rating: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        score: { type: 'number', minimum: 1, maximum: 5 },
                        comment: { type: 'string' },
                        user: { type: 'string' },
                        shop: { type: 'string' },
                        reservation: { type: 'string' },
                    },
                },
                Announcement: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        imageUrl: { type: 'string', nullable: true },
                        shop: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
