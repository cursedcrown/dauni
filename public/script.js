const form = document.getElementById("personForm");
const peopleList = document.getElementById("peopleList");


// Получаем людей из localStorage
let people = JSON.parse(localStorage.getItem("people")) || [];


// Показываем людей при открытии сайта
renderPeople();


// Добавление нового человека
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const bio = document.getElementById("bio").value.trim();
    const photoInput = document.getElementById("photo");

    if (!photoInput.files.length) {
        alert("Выберите фотографию");
        return;
    }

    const file = photoInput.files[0];

    // Проверяем, что это изображение
    if (!file.type.startsWith("image/")) {
        alert("Можно загружать только изображения");
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {

        const person = {
            id: Date.now(),
            name: name,
            bio: bio,
            photo: reader.result
        };

        people.push(person);

        savePeople();

        renderPeople();

        form.reset();
    };

    reader.readAsDataURL(file);
});


// Сохранение
function savePeople() {

    localStorage.setItem(
        "people",
        JSON.stringify(people)
    );
}


// Отображение карточек
function renderPeople() {

    peopleList.innerHTML = "";

    if (people.length === 0) {

        peopleList.innerHTML = `
            <p class="empty-message">
                Пока никто не добавлен.
            </p>
        `;

        return;
    }


    people.forEach(function(person) {

        const card = document.createElement("article");

        card.className = "person-card";

        card.innerHTML = `
            <img
                class="person-photo"
                src="${person.photo}"
                alt="${escapeHTML(person.name)}"
            >

            <div class="person-info">

                <h3>
                    ${escapeHTML(person.name)}
                </h3>

                <p>
                    ${escapeHTML(person.bio)}
                </p>

                <button
                    class="delete-button"
                    onclick="deletePerson(${person.id})"
                >
                    Удалить
                </button>

            </div>
        `;

        peopleList.appendChild(card);
    });
}


// Удаление человека
function deletePerson(id) {

    const confirmed = confirm(
        "Удалить этого человека?"
    );

    if (!confirmed) {
        return;
    }

    people = people.filter(function(person) {
        return person.id !== id;
    });

    savePeople();

    renderPeople();
}


// Защита от HTML-кода в имени/биографии
function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}