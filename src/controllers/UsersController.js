// class permite que dentro dela tenha varias funções. por isso será utilizada.

// Controller terá 5 metodos:

/*
index - GET para listar os registros

show - GET para exibir registro especifico

create - POST para criar registro

update - PUT para atualizar registro

delete - DELETE para remover registro
*/

// metodo = função na classe
const { hash, compare } = require('bcryptjs')
const sqliteConnection = require("../database/sqlite")

const AppError = require("../utils/AppError")

class UsersController {
    async create(request, response) {
        const { name, email, password } = request.body

        const database = await sqliteConnection();

        const checkUserExists = await database.get("SELECT * FROM users WHERE email = (?)", [email])

        if(checkUserExists) {
            throw new AppError("Este e-mail já está em uso.")
        }

        const hashedPassword = await hash(password, 8)

    await database.run("INSERT INTO users (name, email, password) values (?, ?, ?)", [name, email, hashedPassword])

    return response.status(201).json();
    }

    async update(request, response) {
        const { name, email, password, old_password } = request.body
        const user_id = request.user.id;

        const database = await sqliteConnection()
        const user = await database.get("SELECT * FROM users WHERE id = (?)", [user_id])

        if (!user) {
            throw new AppError("Usuário não encontrado.")
        }

        const userWithUpdatedEmail = await database.get("SELECT * FROM users WHERE email = (?)", [email])

        if(userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
            throw new AppError("Este e-mail já está em uso.")
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if(password && !old_password) {
            throw new AppError("Você precisa informar a senha antiga para definir a nova senha.")
        }
        if (password && old_password) {
            const checkOldPassword = await compare(old_password, user.password)

            if (!checkOldPassword) {
                throw new AppError("A senha antiga não confere.")
            }

            user.password = await hash(password, 8);
        }

        await database.run(`
        UPDATE users SET 
        name = ?, 
        email = ?, 
        password = ?, 
        updated_at = DATETIME('now')
        WHERE id = ?`, [user.name, user.email, user.password, user_id])

        return response.status(200).json()
    }
}

module.exports = UsersController