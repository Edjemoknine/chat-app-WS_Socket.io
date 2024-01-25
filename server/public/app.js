const socket = io("ws://localhost:3500");
const message = document.querySelector("#message");
const nameInput = document.querySelector("#name");
const chatRoom = document.querySelector("#room");
const active = document.querySelector(".active");
const usersList = document.querySelector(".user-list");
const roomList = document.querySelector(".room-list");
const chatDisplay = document.querySelector(".chat-display");

const sendMessage = (e) => {
  e.preventDefault();
  active.textContent = "";
  if (message.value && nameInput.value) {
    socket.emit("message", {
      name: nameInput.value,
      text: message.value,
    });
    message.value = "";
  }
  message.focus();
};

const enterRoom = (e) => {
  e.preventDefault();
  if (nameInput.value && chatRoom.value) {
    socket.emit("enterRoom", {
      name: nameInput.value,
      room: chatRoom.value,
    });
  }
};

document.querySelector(".form-msg").addEventListener("submit", sendMessage);
document.querySelector(".join").addEventListener("submit", enterRoom);

socket.on("message", (data) => {
  console.log(data);
  active.textContent = "";
  const { name, text, time } = data;
  const li = document.createElement("li");
  li.className = "post";
  if (name === nameInput.value) li.className = "post-left";
  if (name !== nameInput.value) li.className = "post-right";
  if (name !== "Admin") {
    li.innerHTML = `
    <div class="post-header ${name === nameInput.value ? "user" : "peer"}">
    <span class="post-name">${name}</span>
    <span class="post-time">${time}</span>
    </div>
    <div class="post-text">
      ${text}
    </div>
    `;
  } else {
    li.innerHTML = `<div class='post post-text'>${text}</div>`;
  }
  document.querySelector("ul").appendChild(li);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

message.addEventListener("keypress", (e) => {
  socket.emit("active", nameInput.value);
});

let TimeActivity;
socket.on("active", (name) => {
  active.textContent = `${name} is typing...`;

  clearTimeout(TimeActivity);
  TimeActivity = setTimeout(() => {
    active.textContent = " ";
  }, 2000);
});

socket.on("userList", ({ users }) => {
  console.log(users);
  showUsers(users);
});
socket.on("roomList", ({ rooms }) => {
  showRooms(rooms);
});

const showUsers = (users) => {
  usersList.textContent = "";
  if (users) {
    usersList.innerHTML = `<em>Users in ${chatRoom.value}</em>`;
    users.forEach((user) => {
      usersList.textContent += `  ${user.name}`;
    });
  }
};
const showRooms = (rooms) => {
  roomList.textContent = "";
  if (rooms) {
    roomList.innerHTML = `<em> Active Room </em>`;
    rooms.forEach((room) => {
      roomList.textContent += `  ${room}`;
    });
  }
};
