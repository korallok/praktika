const { DB_PATH, initializeDatabase, seedDatabase, seedUser } = require("./database");

const db = initializeDatabase();
seedDatabase(db);

console.log("Seed-данные проверены и готовы к использованию.");
console.log(`Файл базы данных: ${DB_PATH}`);
console.log(`Тестовый пользователь: ${seedUser.username} / ${seedUser.password}`);
