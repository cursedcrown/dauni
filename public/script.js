let adminLogin = null;
let adminPassword = null;


// =========================
// ЗАГРУЗКА ЛЮДЕЙ
// =========================

async function loadPeople() {

    const response =
        await fetch("/api/people");

    const people =
        await response.json();

    const list =
        document.getElementById("peopleList");

    list.innerHTML = "";

    if (people.length === 0) {
        list.innerHTML =
            "<p>Пока никто не добавлен.</p>";

        return;
    }

    people.forEach(person => {

        const card =
            document.createElement("div");

        card.className =
            "person-card";

        card.innerHTML = `
            <img
                src="${person.photo}"
                alt="${escapeHtml(person.name)}"
            >

            <div class="person-info">
                <h2>
                    ${escapeHtml(person.name)}
                </h2>

                <p>
                    ${escapeHtml(person.bio)}
                </p>
            </div>
        `;


        // Кнопка удаления
        // появляется ТОЛЬКО у админа

        if (
            adminLogin &&
            adminPassword
        ) {

            const deleteButton =
                document.createElement("button");

            deleteButton.textContent =
                "🗑 Удалить";

            deleteButton.className =
                "delete-button";

            deleteButton.onclick =
                () => deletePerson(person.id);

            card.appendChild(
                deleteButton
            );
        }

        list.appendChild(card);
    });
}


// =========================
// КНОПКА ВХОДА
// =========================

document
    .getElementById("adminButton")
    .addEventListener(
        "click",
        async () => {

            const login =
                prompt(
                    "Логин администратора:"
                );

            if (!login) return;


            const password =
                prompt(
                    "Пароль администратора:"
                );

            if (!password) return;


            // Настоящая проверка
            // на сервере

            const response =
                await fetch(
                    "/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            login: login,
                            password: password
                        })
                    }
                );


            if (!response.ok) {

                alert(
                    "❌ Неверный логин или пароль."
                );

                return;
            }


            // Запоминаем данные
            // только после успешной проверки

            adminLogin = login;
            adminPassword = password;


            // Показываем админку

            document
                .getElementById("adminPanel")
                .classList
                .remove("hidden");


            document
                .getElementById("adminButton")
                .textContent =
                "🔓 Вы вошли как администратор";


            loadPeople();
        }
    );


// =========================
// ВЫХОД
// =========================

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        () => {

            adminLogin = null;
            adminPassword = null;


            document
                .getElementById("adminPanel")
                .classList
                .add("hidden");


            document
                .getElementById("adminButton")
                .textContent =
                "🔐 Войти как администратор";


            loadPeople();
        }
    );


// =========================
// ДОБАВЛЕНИЕ
// =========================

document
    .getElementById("personForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (
                !adminLogin ||
                !adminPassword
            ) {

                alert(
                    "Сначала войдите как администратор."
                );

                return;
            }


            const name =
                document
                    .getElementById("name")
                    .value;

            const bio =
                document
                    .getElementById("bio")
                    .value;

            const photo =
                document
                    .getElementById("photo")
                    .files[0];


            const formData =
                new FormData();

            formData.append(
                "name",
                name
            );

            formData.append(
                "bio",
                bio
            );

            formData.append(
                "photo",
                photo
            );


            const response =
                await fetch(
                    "/api/people",
                    {
                        method: "POST",

                        headers: {
                            "x-admin-login":
                                adminLogin,

                            "x-admin-password":
                                adminPassword
                        },

                        body: formData
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                alert(
                    "Ошибка: " +
                    (
                        result.error ||
                        "Неизвестная ошибка"
                    )
                );

                return;
            }


            alert(
                "✅ Одногруппник добавлен!"
            );


            document
                .getElementById("personForm")
                .reset();


            loadPeople();
        }
    );


// =========================
// УДАЛЕНИЕ
// =========================

async function deletePerson(id) {

    if (
        !confirm(
            "Точно удалить этого человека?"
        )
    ) {
        return;
    }


    const response =
        await fetch(
            "/api/people/" + id,
            {
                method: "DELETE",

                headers: {
                    "x-admin-login":
                        adminLogin,

                    "x-admin-password":
                        adminPassword
                }
            }
        );


    if (!response.ok) {

        alert(
            "❌ Не удалось удалить."
        );

        return;
    }


    alert("✅ Удалено.");

    loadPeople();
}


// =========================
// ЗАЩИТА ОТ HTML
// =========================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// =========================
// ЗАПУСК
// =========================

loadPeople();