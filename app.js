/* ==========================================================
   StudentTasker — Main JavaScript (app.js)
   
   This file handles ALL the interactive functionality:
   - Mobile navigation toggle
   - Toast notifications
   - localStorage read/write for tasks
   - Task CRUD operations (Create, Read, Update, Delete)
   - Rendering tasks on the dashboard
   - Filter tabs for sorting tasks
   - Edit modal for updating tasks
   - Contact form handler
   
   TABLE OF CONTENTS:
   1. Mobile Navigation Toggle
   2. Toast Notification
   3. localStorage Helpers
   4. Task CRUD Operations
   5. Rendering Tasks on Dashboard
   6. Creating Task Cards (HTML)
   7. Helper Functions
   8. Add Task Form Handler
   9. Filter Tabs
   10. Edit Modal
   11. Contact Form Handler
   12. Initialization
   ========================================================== */


// ==================== 1. MOBILE NAVIGATION TOGGLE ====================
// When the hamburger button is clicked, we toggle the 'open' class
// on the nav-links list to show/hide it on mobile screens.

const navToggle = document.getElementById('navToggle');  // Hamburger button
const navLinks = document.getElementById('navLinks');    // Nav links <ul>

if (navToggle) {
    navToggle.addEventListener('click', function () {
        // Toggle the 'open' class — CSS uses this to show/hide the menu
        navLinks.classList.toggle('open');
    });
}


// ==================== 2. TOAST NOTIFICATION ====================
/**
 * showToast() — Displays a small pop-up notification at the bottom-right.
 * Used to give feedback (e.g., "Task added!", "Task deleted").
 * 
 * @param {string} message - The text to display in the toast
 * @param {string} type    - The color type: 'success' (green), 'error' (red), or 'info' (purple)
 */
function showToast(message, type) {
    // Default to 'success' if no type is provided
    if (!type) {
        type = 'success';
    }

    var toast = document.getElementById('toast');

    // If there's no toast element on this page, do nothing
    if (!toast) return;

    // Set the message text
    toast.textContent = message;

    // Set the CSS classes (toast + type + show)
    toast.className = 'toast ' + type + ' show';

    // Automatically hide the toast after 3 seconds
    setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}


// ==================== 3. LOCAL STORAGE HELPERS ====================
// localStorage allows us to save data in the browser that persists
// even after the page is refreshed or the browser is closed.
// We store tasks as a JSON string under the key 'studentTaskerTasks'.

/**
 * getTasks() — Reads the tasks array from localStorage.
 * If nothing is stored yet, returns an empty array [].
 * 
 * @returns {Array} Array of task objects
 */
function getTasks() {
    var data = localStorage.getItem('studentTaskerTasks');

    // If data exists, parse the JSON string back into an array
    // Otherwise, return an empty array
    if (data) {
        return JSON.parse(data);
    } else {
        return [];
    }
}

/**
 * saveTasks() — Saves the given tasks array to localStorage.
 * Converts the array to a JSON string before storing.
 * 
 * @param {Array} tasks - Array of task objects to save
 */
function saveTasks(tasks) {
    localStorage.setItem('studentTaskerTasks', JSON.stringify(tasks));
}


// ==================== 4. TASK CRUD OPERATIONS ====================
// CRUD = Create, Read, Update, Delete
// These functions modify the tasks array in localStorage.

/**
 * addTask() — Creates a new task object and adds it to localStorage.
 * 
 * Each task object has these properties:
 *   - id:          Unique number (using timestamp for uniqueness)
 *   - title:       The task name (string)
 *   - description: Optional details about the task (string)
 *   - category:    'Study', 'Assignment', or 'Personal' (string)
 *   - dueDate:     Date in YYYY-MM-DD format (string)
 *   - completed:   Whether the task is done (boolean, starts as false)
 * 
 * @param {string} title       - Task title
 * @param {string} description - Task description (can be empty)
 * @param {string} category    - Task category
 * @param {string} dueDate     - Due date string
 * @returns {object} The newly created task object
 */
function addTask(title, description, category, dueDate) {
    var tasks = getTasks();

    // Create a new task object
    var newTask = {
        id: Date.now(),                     // Unique ID based on current timestamp
        title: title.trim(),                // Remove extra whitespace
        description: description.trim(),
        category: category,                 // 'Study', 'Assignment', or 'Personal'
        dueDate: dueDate,                   // Date string (YYYY-MM-DD)
        completed: false                    // New tasks start as not completed
    };

    // Add the new task to the end of the array
    tasks.push(newTask);

    // Save the updated array back to localStorage
    saveTasks(tasks);

    return newTask;
}

/**
 * editTask() — Updates an existing task by its ID.
 * Uses the spread operator to merge the new fields into the existing task.
 * 
 * @param {number} id             - The task's unique ID
 * @param {object} updatedFields  - Object containing the fields to update
 *                                  e.g., { title: "New Title", dueDate: "2026-04-01" }
 */
function editTask(id, updatedFields) {
    var tasks = getTasks();

    // Find which index the task is at in the array
    var index = tasks.findIndex(function (task) {
        return task.id === id;
    });

    // If found (index is not -1), merge the updated fields
    if (index !== -1) {
        // Spread operator: keeps existing properties, overwrites with new ones
        tasks[index] = Object.assign({}, tasks[index], updatedFields);
        saveTasks(tasks);
    }
}

/**
 * deleteTask() — Removes a task from localStorage by its ID.
 * Uses filter() to create a new array without the deleted task.
 * 
 * @param {number} id - The task's unique ID
 */
function deleteTask(id) {
    var tasks = getTasks();

    // Keep every task EXCEPT the one with the matching ID
    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });

    saveTasks(tasks);
}

/**
 * toggleComplete() — Flips the 'completed' status of a task.
 * If it was false, it becomes true, and vice versa.
 * 
 * @param {number} id - The task's unique ID
 */
function toggleComplete(id) {
    var tasks = getTasks();

    // Find the task with the matching ID
    var task = tasks.find(function (task) {
        return task.id === id;
    });

    // If found, flip the completed status
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
    }
}


// ==================== 5. RENDERING TASKS ON DASHBOARD ====================
// These variables reference elements on the dashboard page.
// They will be null on other pages (Home, About, Contact) — that's okay,
// because we check for null before using them.

var pendingTaskList = document.getElementById('pendingTaskList');
var completedTaskList = document.getElementById('completedTaskList');
var totalCountEl = document.getElementById('totalCount');
var pendingCountEl = document.getElementById('pendingCount');
var completedCountEl = document.getElementById('completedCount');

// Track the currently active filter (default: show all tasks)
var currentFilter = 'all';

/**
 * renderTasks() — Reads all tasks from localStorage and renders them
 * into the Pending and Completed sections on the dashboard.
 * 
 * This function:
 * 1. Gets all tasks from localStorage
 * 2. Separates them into pending and completed arrays
 * 3. Applies the current filter (if any)
 * 4. Updates the counter numbers
 * 5. Creates task card HTML elements and adds them to the page
 */
function renderTasks() {
    // Only run on the dashboard page (where these elements exist)
    if (!pendingTaskList || !completedTaskList) return;

    var tasks = getTasks();

    // Step 1: Separate tasks into pending (not completed) and completed
    var pending = tasks.filter(function (t) { return !t.completed; });
    var completed = tasks.filter(function (t) { return t.completed; });

    // Step 2: Apply the current filter
    if (currentFilter === 'pending') {
        // Show only pending tasks
        completed = [];
    } else if (currentFilter === 'completed') {
        // Show only completed tasks
        pending = [];
    } else if (currentFilter === 'Study' || currentFilter === 'Assignment' || currentFilter === 'Personal') {
        // Filter by category
        pending = pending.filter(function (t) { return t.category === currentFilter; });
        completed = completed.filter(function (t) { return t.category === currentFilter; });
    }
    // If currentFilter is 'all', no filtering needed — show everything

    // Step 3: Update the counter numbers (always show total counts, not filtered)
    var allTasks = getTasks();
    totalCountEl.textContent = allTasks.length;
    pendingCountEl.textContent = allTasks.filter(function (t) { return !t.completed; }).length;
    completedCountEl.textContent = allTasks.filter(function (t) { return t.completed; }).length;

    // Step 4: Render PENDING tasks
    pendingTaskList.innerHTML = '';  // Clear previous content

    if (pending.length === 0) {
        // Show empty state message
        pendingTaskList.innerHTML = '<div class="empty-state"><p>🎉 No pending tasks! Add one above.</p></div>';
    } else {
        // Create a task card for each pending task
        pending.forEach(function (task) {
            pendingTaskList.appendChild(createTaskCard(task));
        });
    }

    // Step 5: Render COMPLETED tasks
    completedTaskList.innerHTML = '';  // Clear previous content

    if (completed.length === 0) {
        completedTaskList.innerHTML = '<div class="empty-state"><p>No completed tasks yet.</p></div>';
    } else {
        completed.forEach(function (task) {
            completedTaskList.appendChild(createTaskCard(task));
        });
    }
}


// ==================== 6. CREATING TASK CARDS ====================
/**
 * createTaskCard() — Builds a single task card as a DOM element.
 * Each card has a checkbox, title, category badge, description,
 * due date, and edit/delete buttons.
 * 
 * @param {object} task - A task object from localStorage
 * @returns {HTMLElement} The task card div element
 */
function createTaskCard(task) {
    // Create the main card container
    var card = document.createElement('div');
    card.classList.add('task-card');

    // Add 'completed' class if the task is done (for styling)
    if (task.completed) {
        card.classList.add('completed');
    }

    // Format the due date for display (e.g., "Mar 15, 2026")
    var formattedDate = formatDate(task.dueDate);

    // Check if the task is overdue (due date is in the past and not completed)
    var today = new Date();
    today.setHours(0, 0, 0, 0);  // Reset time to start of day for fair comparison
    var isOverdue = !task.completed && new Date(task.dueDate) < today;

    // Set CSS class for overdue dates (highlighted in red)
    var dueDateClass = isOverdue ? 'task-date overdue' : 'task-date';
    var overdueText = isOverdue ? ' (Overdue!)' : '';

    // Build the card's inner HTML
    // Using template literals (backtick strings) for clean multi-line HTML
    card.innerHTML =
        // Checkbox button (circle that toggles completion)
        '<button class="task-checkbox ' + (task.completed ? 'checked' : '') + '" ' +
        '        data-id="' + task.id + '" ' +
        '        title="' + (task.completed ? 'Mark as Pending' : 'Mark as Completed') + '">' +
        (task.completed ? '✓' : '') +
        '</button>' +

        // Task body (title, category badge, description, meta info)
        '<div class="task-body">' +
        '    <div class="task-header">' +
        '        <span class="task-title">' + escapeHTML(task.title) + '</span>' +
        '        <span class="category-badge ' + task.category + '">' + task.category + '</span>' +
        '    </div>' +

        // Only show description if it's not empty
        (task.description ? '<p class="task-description">' + escapeHTML(task.description) + '</p>' : '') +

        // Meta row: due date + edit/delete buttons
        '    <div class="task-meta">' +
        '        <span class="' + dueDateClass + '">📅 ' + formattedDate + overdueText + '</span>' +
        '        <div class="task-actions">' +
        '            <button class="edit-btn" data-id="' + task.id + '">✏️ Edit</button>' +
        '            <button class="delete-btn" data-id="' + task.id + '">🗑️ Delete</button>' +
        '        </div>' +
        '    </div>' +
        '</div>';


    // ===== ATTACH EVENT LISTENERS TO THE CARD =====

    // 1. CHECKBOX CLICK — Toggle completion status
    card.querySelector('.task-checkbox').addEventListener('click', function () {
        toggleComplete(task.id);
        renderTasks();  // Re-render to move the task to the correct section

        // Show appropriate toast message
        if (task.completed) {
            showToast('Task marked as Pending', 'success');
        } else {
            showToast('Task marked as Completed!', 'success');
        }
    });

    // 2. EDIT BUTTON CLICK — Open the edit modal
    card.querySelector('.edit-btn').addEventListener('click', function () {
        openEditModal(task);
    });

    // 3. DELETE BUTTON CLICK — Delete the task (with confirmation)
    card.querySelector('.delete-btn').addEventListener('click', function () {
        // Show a confirmation dialog before deleting
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
            renderTasks();  // Re-render the task list
            showToast('Task deleted', 'error');
        }
    });

    return card;
}


// ==================== 7. HELPER FUNCTIONS ====================

/**
 * formatDate() — Converts a date string from 'YYYY-MM-DD' format
 * into a more readable format like 'Mar 15, 2026'.
 * 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return 'No date set';

    // Formatting options for toLocaleDateString()
    var options = { year: 'numeric', month: 'short', day: 'numeric' };

    // Adding T00:00:00 prevents timezone offset issues
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
}

/**
 * escapeHTML() — Prevents XSS (Cross-Site Scripting) attacks by
 * escaping special HTML characters like <, >, &, ", etc.
 * 
 * For example: '<script>' becomes '&lt;script&gt;'
 * This ensures user input is displayed as text, not executed as HTML.
 * 
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;    // The browser automatically escapes the text
    return div.innerHTML;     // Return the escaped version
}


// ==================== 8. ADD TASK FORM HANDLER ====================
// Listens for the form submission on the dashboard page.
// When the user clicks "Add Task", this captures the form data,
// creates a new task, and re-renders the task list.

var taskForm = document.getElementById('taskForm');

if (taskForm) {
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();  // Prevent the page from reloading

        // Read values from the form inputs
        var title = document.getElementById('taskTitle').value;
        var description = document.getElementById('taskDescription').value;
        var category = document.getElementById('taskCategory').value;
        var dueDate = document.getElementById('taskDueDate').value;

        // Validate that all required fields are filled
        if (!title || !category || !dueDate) {
            showToast('Please fill in all required fields!', 'error');
            return;  // Stop here — don't add the task
        }

        // Create the task and save to localStorage
        addTask(title, description, category, dueDate);

        // Re-render the task list to show the new task
        renderTasks();

        // Clear the form so the user can add another task
        taskForm.reset();

        // Show success feedback
        showToast('Task added successfully!', 'success');
    });
}


// ==================== 9. FILTER TABS ====================
// Each filter button has a data-filter attribute (e.g., "all", "pending", "Study").
// When clicked, we update the currentFilter variable and re-render tasks.

var filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
        // Remove the 'active' class from ALL filter buttons
        filterBtns.forEach(function (b) {
            b.classList.remove('active');
        });

        // Add 'active' class to the clicked button
        btn.classList.add('active');

        // Update the current filter value
        currentFilter = btn.getAttribute('data-filter');

        // Re-render tasks with the new filter applied
        renderTasks();
    });
});


// ==================== 10. EDIT MODAL ====================
// The edit modal is a popup form that lets users update a task's details.
// It is shown when the "Edit" button on a task card is clicked.

var editModal = document.getElementById('editModal');
var editForm = document.getElementById('editForm');
var modalClose = document.getElementById('modalClose');

/**
 * openEditModal() — Opens the edit modal and pre-fills the form
 * with the current values of the task being edited.
 * 
 * @param {object} task - The task object to edit
 */
function openEditModal(task) {
    if (!editModal) return;

    // Fill in the form fields with the task's current data
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description || '';
    document.getElementById('editCategory').value = task.category;
    document.getElementById('editDueDate').value = task.dueDate;

    // Show the modal by adding the 'show' class
    editModal.classList.add('show');
}

/**
 * closeEditModal() — Hides the edit modal.
 */
function closeEditModal() {
    if (editModal) {
        editModal.classList.remove('show');
    }
}

// Close modal when the X (close) button is clicked
if (modalClose) {
    modalClose.addEventListener('click', closeEditModal);
}

// Close modal when clicking outside the modal card (on the dark overlay)
if (editModal) {
    editModal.addEventListener('click', function (e) {
        // Only close if the click was on the overlay itself, not the modal card
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// Handle the edit form submission
if (editForm) {
    editForm.addEventListener('submit', function (e) {
        e.preventDefault();  // Prevent page reload

        // Read the updated values from the edit form
        var id = parseInt(document.getElementById('editTaskId').value);
        var title = document.getElementById('editTitle').value;
        var description = document.getElementById('editDescription').value;
        var category = document.getElementById('editCategory').value;
        var dueDate = document.getElementById('editDueDate').value;

        // Validate required fields
        if (!title || !category || !dueDate) {
            showToast('Please fill in all required fields!', 'error');
            return;
        }

        // Update the task in localStorage
        editTask(id, {
            title: title,
            description: description,
            category: category,
            dueDate: dueDate
        });

        // Close the modal and re-render
        closeEditModal();
        renderTasks();
        showToast('Task updated successfully!', 'info');
    });
}


// ==================== 11. CONTACT FORM HANDLER ====================
// Handles the contact form on the Contact page.
// This is frontend-only — in a real app, you would send the data
// to a backend server or email API like EmailJS.

var contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();  // Prevent page reload

        // Read the form values
        var name = document.getElementById('contactName').value.trim();
        var email = document.getElementById('contactEmail').value.trim();
        var subject = document.getElementById('contactSubject').value.trim();
        var message = document.getElementById('contactMessage').value.trim();

        // Validate that all fields are filled
        if (!name || !email || !subject || !message) {
            showToast('Please fill in all fields!', 'error');
            return;
        }

        // Basic email format validation using regex
        // This checks for: something@something.something
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address!', 'error');
            return;
        }

        // In a real-world app, you would send this data to a server.
        // For this project, we just show a success message.
        contactForm.reset();  // Clear the form
        showToast('Message sent successfully! Thank you 🎉', 'success');
    });
}


// ==================== 12. INITIALIZATION ====================
// When the page finishes loading, render the tasks.
// This only does something on the dashboard page (other pages skip it).

document.addEventListener('DOMContentLoaded', function () {
    renderTasks();
});
