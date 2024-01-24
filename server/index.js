import express from "express";
import { Server } from "socket.io";
const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";
const app = express();

//  in this way i will run fronten and backend in the same port
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
// _________________________________________________

const server = app.listen(PORT, () => {
  console.log("Server running on port:" + PORT);
});

// state

const usersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
};

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : ["http://localhost:5500", "http://127.0.0.1:5500"],
  },
});

io.on("connection", (socket) => {
  console.log("user", socket.id);

  // make message to welcome
  socket.emit("message", BuildMsg(ADMIN, "Welcome to Chat App"));

  //enter Room
  socket.on("enterRoom", ({ name, room }) => {
    // console.log(name, room);
    // make notif if any user leave room
    const prevRoom = getUser(socket.id)?.room;

    if (prevRoom) {
      socket.leave(prevRoom);
      io.to(prevRoom).emit(
        "message",
        BuildMsg(ADMIN, `${name} has left the room`)
      );
    }

    const user = activatedUser(socket.id, name, room);
    if (prevRoom) {
      io.to(prevRoom).emit("userList", {
        users: getUsersInRoom(prevRoom),
      });
    }

    // join room
    socket.join(user.room);

    // Tell you that you have joined the room
    socket.emit(
      "message",
      BuildMsg(ADMIN, `You have joined the ${user.room} chat room `)
    );

    // Tell all room users that new users has joined the room
    socket.broadcast
      .to(user.room)
      .emit("message", BuildMsg(ADMIN, `${user.name} has joined the room`));

    // update user list room
    io.to(user.room).emit("userList", {
      users: getUsersInRoom(user.room),
    });

    //update room list for everyone
    io.emit("roomList", {
      rooms: getAllActiveRoom(),
    });
  });

  // When user disconect all Know that
  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    userLeaveApp(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        BuildMsg(ADMIN, `${user.name} has left the room`)
      );

      io.to(user.room).emit("userList", {
        users: getUsersInRoom(user.room),
      });

      io.emit("roomList", {
        rooms: getAllActiveRoom(),
      });
    }
    console.log(`User ${socket.id} disconnected`);
  });

  //  listening to message and send it again to the room
  socket.on("message", ({ name, text }) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      io.to(room).emit("message", BuildMsg(name, text));
    }
  });

  // listen for activity user Typing
  socket.on("active", (name) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      socket.broadcast.to(room).emit("active", name);
    }
  });
});

// __________________ Generate Msg

const BuildMsg = (name, text) => {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(new Date()),
  };
};

// _______________ User State

const activatedUser = (id, name, room) => {
  const user = { id, name, room };

  usersState.setUsers([
    ...usersState.users.filter((user) => user.id !== id),
    user,
  ]);

  return user;
};

const userLeaveApp = (id) => {
  usersState.setUsers([...usersState.users.filter((user) => user.id !== id)]);
};

const getUser = (id) => {
  return usersState.users.find((user) => user.id !== id);
};

const getUsersInRoom = (room) => {
  return usersState.users.filter((user) => user.room === room);
};
const getAllActiveRoom = () => {
  return Array.from(new Set(usersState.users.map((user) => user.room)));
};
