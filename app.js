const dbName = "test";
const dbVersion = 1;
const storeName = "indexDB";

const openRequest = indexedDB.open(dbName, dbVersion);

openRequest.onupgradeneeded = (event) => {
  const db = event.target.result;
  // Create the object store if it doesn't exist
  if (!db.objectStoreNames.contains(storeName)) {
    db.createObjectStore(storeName, { keyPath: "id" });
  }
};

openRequest.onerror = (event) => {
  console.error("Database error: " + event.target.errorCode);
};

openRequest.onsuccess = (event) => {
  const db = event.target.result;

  // Fetch and store data from data.json if it doesn't exist in IndexedDB
  fetch("assets/data.json")
    .then((response) => response.json())
    .then((jsonData) => {
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      // Check if data.json records already exist in IndexedDB
      objectStore.count().onsuccess = (event) => {
        const count = event.target.result;
        if (count === 0) {
          // Store data from data.json into IndexedDB
          jsonData.forEach((item) => {
            objectStore.add(item);
          });
        }

        // Display data from IndexedDB
        displayData(db);
        updateFavoritesTable(db);
      };
    })
    .catch((error) => {
      console.error("Error loading JSON data: " + error);
    });
};

function displayData(db) {
  const transaction = db.transaction(storeName, "readonly");
  const objectStore = transaction.objectStore(storeName);
  const dataTable = document.getElementById("dataTable");
  const tbody = dataTable.querySelector("tbody");
  const favoritesTable = document.getElementById("favoritesTable");
  const favoritesTbody = favoritesTable.querySelector("tbody");

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const data = cursor.value;
      const row = document.createElement("tr");

      row.innerHTML = `
                        <td>${data.id}</td>
                        <td>${data.value1}</td>
                        <td>${data.value2}</td>
                        <td><input type="checkbox" data-id="${data.id}" ${
        data.isFav ? "checked" : ""
      } /></td>
                    `;

      // Add an event listener to the checkbox
      const checkbox = row.querySelector('input[type="checkbox"]');
      checkbox.addEventListener("change", (event) => {
        const id = parseInt(event.target.getAttribute("data-id"));
        const checked = event.target.checked;

        // Update the 'isFav' flag in IndexedDB
        updateIsFavFlag(db, id, checked);

        // Update the "Favorites" table in real-time
        updateFavoritesTable(db);
      });

      tbody.appendChild(row);

      cursor.continue();
    }
  };
}

function updateIsFavFlag(db, id, isFav) {
  const transaction = db.transaction(storeName, "readwrite");
  const objectStore = transaction.objectStore(storeName);

  const request = objectStore.get(id);
  request.onsuccess = (event) => {
    const data = event.target.result;
    if (data) {
      data.isFav = isFav;
      objectStore.put(data);
    }
  };
}

function updateFavoritesTable(db) {
  const transaction = db.transaction(storeName, "readonly");
  const objectStore = transaction.objectStore(storeName);
  const favoritesTable = document.getElementById("favoritesTable");
  const favoritesTbody = favoritesTable.querySelector("tbody");

  // Clear existing favorite table rows
  favoritesTbody.innerHTML = "";

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const data = cursor.value;
      if (data.isFav) {
        const favoritesRow = document.createElement("tr");
        favoritesRow.innerHTML = `
                            <td>${data.id}</td>
                            <td>${data.value1}</td>
                            <td>${data.value2}</td>
                        `;
        favoritesTbody.appendChild(favoritesRow);
      }
      cursor.continue();
    }
  };
}
