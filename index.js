const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;

// Configuração do Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Notebooks Lenovo',
            version: '1.0.0',
            description: 'API para buscar notebooks Lenovo através de scraping.',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
    },
    apis: ['./index.js'], // onde as anotações Swagger estão localizadas
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Função para fazer o scraping
async function fetchLaptops() {
    const laptops = [];
    let page = 1;

    while (true) {
        try {
            // Faz a requisição para a página atual
            const { data } = await axios.get(`https://webscraper.io/test-sites/e-commerce/static/computers/laptops?page=${page}`);
            const $ = cheerio.load(data);

            // Se não encontrar a thumbnail, significa que chegamos ao final
            if ($('.thumbnail').length === 0) {
                break; // Sai do loop se não encontrar mais itens
            }

            $('.thumbnail').each((i, elem) => {
                const title = $(elem).find('.title').text().trim();
                const price = parseFloat($(elem).find('.price').text().replace('$', ''));
                const description = $(elem).find('.description').text().trim();

                // Adiciona apenas laptops Lenovo
                if (title.toLowerCase().includes('lenovo')) {
                    laptops.push({ title, price, description });
                }
            });

            page++; // Avança para a próxima página
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            break; // Sai do loop em caso de erro
        }
    }

    // Ordena os notebooks pelo preço (do mais barato para o mais caro)
    laptops.sort((a, b) => a.price - b.price);

    return laptops;
}

/**
 * @swagger
 * /lenovo-laptops:
 *   get:
 *     summary: Retorna uma lista de notebooks Lenovo.
 *     responses:
 *       200:
 *         description: Lista de notebooks Lenovo.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: O título do notebook.
 *                   price:
 *                     type: number
 *                     description: O preço do notebook.
 *                   description:
 *                     type: string
 *                     description: A descrição do notebook.
 */
app.get('/lenovo-laptops', async (req, res) => {
    const laptops = await fetchLaptops();
    res.json(laptops);
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
