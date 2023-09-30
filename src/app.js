const dbName = "test";
const dbVersion = 1;
const storeName = "indexDB";

const openRequest = indexedDB.open(dbName, dbVersion);
let db; // Reference to the IndexedDB database
const changeFavDataState = []; // fav data ==> {id,isFav}
const changeSkipDataState = []; // skip data ==> {id,isSkip}
const deleteData = []; // delete data ==> {id}

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
// var request = indexedDB.deleteDatabase("test");


openRequest.onupgradeneeded = (event) => {
  db = event.target.result;
  // Create the object store if it doesn't exist
  if (!db.objectStoreNames.contains(storeName)) {
    db.createObjectStore(storeName, { keyPath: "id" });
  }
};

openRequest.onerror = (event) => {
  console.error("Database error: " + event.target.errorCode);
};

openRequest.onsuccess = (event) => {
  db = event.target.result;

  // Fetch and store data from data.json if it doesn't exist in IndexedDB
  fetch("assets/data.json")
    .then((response) => response.json())
    .then((jsonData) => {
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      // Check if data.json records already exist in IndexedDB
      objectStore.count().onsuccess = (event) => {
        const count = event.target.result;
        const countJsonData = jsonData.length;

        console.log(jsonData);
        if (count == 0) {          
          // Store data from data.json into IndexedDB
          jsonData.forEach((item) => {
            objectStore.add(item);
          });
        }

        // Display data from IndexedDB
        displayData();
        // updateFavoritesTable(db);
      };
    })
    .catch((error) => {
      console.error("Error loading JSON data: " + error);
    });
};

function displayData() {
  if (!db) {
    console.error("Database is not open yet.");
    return;
  }

  const transaction = db.transaction(storeName, "readonly");
  const objectStore = transaction.objectStore(storeName);
  const dataTable = document.getElementById("dataTable");

  const tbody = dataTable.querySelector("tbody");
  tbody.innerHTML = "";
  // const favoritesTable = document.getElementById("favoritesTable");
  // const favoritesTbody = favoritesTable.querySelector("tbody");

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const data = cursor.value;

      const row = appendData(data);
      tbody.appendChild(row);

      cursor.continue();
    }
  };
}

function displayFavData() {
  if (!db) {
    console.error("Database is not open yet.");
    return;
  }

  const transaction = db.transaction(storeName, "readonly");
  const objectStore = transaction.objectStore(storeName);
  const dataTable = document.getElementById("dataTable");

  const tbody = dataTable.querySelector("tbody");
  tbody.innerHTML = "";
  // const favoritesTable = document.getElementById("favoritesTable");
  // const favoritesTbody = favoritesTable.querySelector("tbody");

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const data = cursor.value;

      if (data.isFav) {
        const row = appendData(data);
        tbody.appendChild(row);        
      }
      cursor.continue();
    }
  };
}

function displaySkipData() {
  if (!db) {
    console.error("Database is not open yet.");
    return;
  }

  const transaction = db.transaction(storeName, "readonly");
  const objectStore = transaction.objectStore(storeName);
  const dataTable = document.getElementById("dataTable");

  const tbody = dataTable.querySelector("tbody");
  tbody.innerHTML = "";
  // const favoritesTable = document.getElementById("favoritesTable");
  // const favoritesTbody = favoritesTable.querySelector("tbody");

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const data = cursor.value;

      if (data.isSkip) {
        const row = appendData(data);
        tbody.appendChild(row);
      }
      cursor.continue();
    }
  };
}

function updateIsFavFlag(id, isFav) {
  const transaction = db.transaction(storeName, "readwrite");
  const objectStore = transaction.objectStore(storeName);

  const request = objectStore.get(id);
  request.onsuccess = (event) => {
    const data = event.target.result;
    if (data) {
      data.isFav = isFav;
      objectStore.put(data);
      console.log(id, isFav);
    }
  };
}

function updateIsSkipFlag(id, isSkip) {
  const transaction = db.transaction(storeName, "readwrite");
  const objectStore = transaction.objectStore(storeName);

  const request = objectStore.get(id);
  request.onsuccess = (event) => {
    const data = event.target.result;
    if (data) {
      data.isSkip = isSkip;
      objectStore.put(data);
    }
  };
}

function deleteDBData(id) {
  const transaction = db.transaction(storeName, "readwrite");
  const objectStore = transaction.objectStore(storeName);

  const request = objectStore.get(id);
  request.onsuccess = (event) => {
    const data = event.target.result;
    if (data) {
      objectStore.delete(id);
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

function getSelectedOptionText() {
  const selectedOption = document.querySelector(".filter-option.selected");
  
  if (selectedOption) {
    return selectedOption.id;
  } else {
    // Return a default value or handle the case when no option is selected
    return null;
  }
}

function loadUpdatedTable() {

  const option = getSelectedOptionText();

  console.log(typeof option);
  console.log(option);

  if (option == '1') {
    const dataTable = document.getElementById("dataTable");
    const tbody = dataTable.querySelector("tbody");
    tbody.innerHTML = "";
  
    displayData();
  } else if (option == '2') {
    displayFavData();
  } else if(option=='3'){    
    displaySkipData();
  }
}

function updateData() {

  try {
    changeFavDataState.forEach((item) => {
      updateIsFavFlag(item.id, item.isFav);
    });
  
    changeSkipDataState.forEach((item) => {
      updateIsSkipFlag(item.id, item.isSkip);
    });
  
    deleteData.forEach((item) => {
      deleteDBData(item.id);
    });
  
    hideUpdateOption();
    loadUpdatedTable();
    createToast(
      "Data Updated !",
      "success-toast",
      3000
    ); // 3000ms duration
  } catch (error) {
    createToast(
      error.message,
      "error-toast",
      3000
    ); // 3000ms duration
  }  
}

function undoData() {
  changeSkipDataState.forEach((item) => {
    const checkbox = document.querySelector(
      `input[type="checkbox"][data-id="${item.id}"].skip`
    );
    console.log(checkbox);
    checkbox.checked = !item.isSkip;
  });

  changeFavDataState.forEach((item) => {
    const checkbox = document.querySelector(
      `input[type="checkbox"][data-id="${item.id}"].favorite`
    );
    checkbox.checked = !item.isFav;
  });

  deleteData.forEach((item) => {
    const checkbox = document.querySelector(
      `input[type="checkbox"][data-id="${item.id}"].delete`
    );
    checkbox.checked = false;
  });

  const updateIcon = document.querySelectorAll(".update-icon");

  updateIcon[0].style.display = "none"; // To hide the element
  updateIcon[1].style.display = "none"; // To hide the element

  //clear array data
  changeFavDataState.length = 0;
  changeSkipDataState.length = 0;
  deleteData.length = 0;
}

function appendData(data) {

  const row = document.createElement("tr");

  row.innerHTML = `
                    <td>${data.id}</td>
                    <td>${data.value1}</td>
                    <td>${data.value2}</td>
                    <td><input type="checkbox" data-id="${
                      data.id
                    }" class="favorite" ${data.isFav ? "checked" : ""} /></td>
  <td><input type="checkbox" data-id="${data.id}" class="skip" ${
    data.isSkip ? "checked" : ""
  } /></td>
  <td><input type="checkbox" data-id="${data.id}" class="delete"/></td>
                `;

  // Add an event listener to the fav checkbox
  const checkbox = row.querySelector('input[type="checkbox"].favorite');
  checkbox.addEventListener("change", (event) => {
    const id = parseInt(event.target.getAttribute("data-id"));
    let isExist = false;
    let idNumber;
    const checked = event.target.checked;

    // Update the 'isFav' flag in IndexedDB

    // updateIsFavFlag(db, id, checked);

    changeFavDataState.forEach((item, index) => {
      if (item.id == data.id) {
        isExist = true;
        changeFavDataState.splice(index, 1);
      }
    });

    console.log(isExist);

    if (!isExist) {
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      const request = objectStore.get(id);

      request.onsuccess = (event) => {
        const data = event.target.result;
        if (data) {
          // data.isFav = checked;
          const fav = { id: id, isFav: checked };
          changeFavDataState.push(fav);
          displayUpdateOption();
        }
      };
    } else {
      changeUpdateOption();
      // Update the "Favorites" table in real-time
      // updateFavoritesTable(db);sa
    }
  });

  // Add an event listener to the skip checkbox
  const skipCheckBox = row.querySelector('input[type="checkbox"].skip');
  skipCheckBox.addEventListener("change", (event) => {
    const id = parseInt(event.target.getAttribute("data-id"));
    let isExist = false;
    let idNumber;
    const checked = event.target.checked;

    // Update the 'isFav' flag in IndexedDB
    // updateIsSkipFlag(db, id, checked);

    changeSkipDataState.forEach((item, index) => {
      if (item.id == data.id) {
        isExist = true;
        changeSkipDataState.splice(index, 1);
      }
    });

    if (!isExist) {
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      const request = objectStore.get(id);

      request.onsuccess = (event) => {
        const data = event.target.result;
        if (data) {
          // data.isSkip = checked;
          const skip = { id: id, isSkip: checked };
          changeSkipDataState.push(skip);
          displayUpdateOption();
        }
      };
    } else {
      changeUpdateOption();
    }

    // Update the "Favorites" table in real-time
    // updateFavoritesTable(db);sa
  });

  // Add an event listener to the delete checkbox
  const deleteCheckBox = row.querySelector('input[type="checkbox"].delete');
  deleteCheckBox.addEventListener("change", (event) => {
    const id = parseInt(event.target.getAttribute("data-id"));
    let isExist = false;
    let idNumber;
    const checked = event.target.checked;

    // Update the 'isFav' flag in IndexedDB
    // updateIsSkipFlag(db, id, checked);

    deleteData.forEach((item, index) => {
      if (item.id == data.id) {
        isExist = true;
        deleteData.splice(index, 1);
      }
    });

    if (!isExist) {
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      const del = { id: id };
      deleteData.push(del);

      displayUpdateOption();
    } else {
      changeUpdateOption();
    }

    // Update the "Favorites" table in real-time
    // updateFavoritesTable(db);sa
  });

  return row;
}

function changeUpdateOption() {
  if (
    changeFavDataState.length > 0 ||
    changeSkipDataState.length > 0 ||
    deleteData.length > 0
  ) {
    displayUpdateOption();
  } else {
    hideUpdateOption();
  }
}

function displayUpdateOption() {
  const updateIcon = document.querySelectorAll(".update-icon");
  updateIcon[0].style.display = "block"; // To visible the element
  updateIcon[1].style.display = "block"; // To visible the element
}

function hideUpdateOption() {
  const updateIcon = document.querySelectorAll(".update-icon");
  updateIcon[0].style.display = "none"; // To hide the element
  updateIcon[1].style.display = "none"; // To hide the element

  changeFavDataState.length = 0;
  changeSkipDataState.length = 0;
  deleteData.length = 0;
}
