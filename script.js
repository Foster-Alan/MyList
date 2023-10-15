document.addEventListener("DOMContentLoaded", function () {
    const taskList = document.getElementById("taskList");
    const taskInput = document.getElementById("taskInput");
    const addTaskButton = document.getElementById("addTask");

    addTaskButton.addEventListener("click", addTask);
    taskList.addEventListener("click", handleTaskActions);

    // Carregar tarefas do localStorage ao carregar a página
    loadTasksFromLocalStorage();

    function addTask() {
        const taskText = taskInput.value;
        if (taskText.trim() === "") return;

        const li = document.createElement("li");
        li.innerHTML = `
            <span>${taskText}</span>
            <button class="move-up">▲</button>
            <button class="move-down">▼</button>
            <button class="delete-button">Excluir</button>
        `;
        taskList.appendChild(li);

        saveTaskToLocalStorage();

        taskInput.value = "";
    }

    function handleTaskActions(event) {
        if (event.target.classList.contains("delete-button")) {
            const li = event.target.parentElement;
            removeTaskFromLocalStorage(li.querySelector("span").textContent);
            taskList.removeChild(li);
        } else if (event.target.classList.contains("move-up")) {
            const li = event.target.parentElement;
            moveTaskUp(li);
        } else if (event.target.classList.contains("move-down")) {
            const li = event.target.parentElement;
            moveTaskDown(li);
        }
    }

    function saveTaskToLocalStorage() {
        let tasks = getTasksFromLocalStorage();
        tasks.push(taskInput.value);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function removeTaskFromLocalStorage(taskText) {
        let tasks = getTasksFromLocalStorage();
        tasks = tasks.filter(task => task !== taskText);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function moveTaskUp(li) {
        if (li.previousElementSibling) {
            const parent = li.parentElement;
            parent.insertBefore(li, li.previousElementSibling);
            updateTasksOrder();
        }
    }

    function moveTaskDown(li) {
        if (li.nextElementSibling) {
            const parent = li.parentElement;
            parent.insertBefore(li.nextElementSibling, li);
            updateTasksOrder();
        }
    }

    function updateTasksOrder() {
        const taskTexts = Array.from(taskList.querySelectorAll("li span")).map(span => span.textContent);
        localStorage.setItem("tasks", JSON.stringify(taskTexts));
    }

    function getTasksFromLocalStorage() {
        const tasks = localStorage.getItem("tasks");
        return tasks ? JSON.parse(tasks) : [];
    }

    function loadTasksFromLocalStorage() {
        const tasks = getTasksFromLocalStorage();
        for (const task of tasks) {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${task}</span>
                <button class="move-up">▲</button>
                <button class="move-down">▼</button>
                <button class="delete-button">Excluir</button>
            `;
            taskList.appendChild(li);
        }
    }
});
