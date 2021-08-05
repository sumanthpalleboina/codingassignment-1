const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
  }
};

initializeDbAndServer();

const convertDbObjectToResponse = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", category = "", priority, status } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE 
              todo LIKE "%${search_q}%"
              AND category LIKE "%${category}%"
              AND status='${status}'
              AND priority='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE 
              todo LIKE "%${search_q}%"
              AND category LIKE "%${category}%"
              AND priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE 
              todo LIKE "%${search_q}%"
              AND category LIKE "%${category}%"
              AND status='${status}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE 
              todo LIKE "%${search_q}%"
              AND category LIKE "%${category}%"
              AND status='${status}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE 
              todo LIKE "%${search_q}%"
              AND category LIKE "%${category}%"
              AND priority='${priority}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE 
              todo LIKE "%${search_q}%"
              AND category LIKE "%${category}%";`;
  }

  data = await db.all(getTodosQuery);
  response.send(
    data.map((each) => {
      return convertDbObjectToResponse(each);
    })
  );
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM 
      todo
    WHERE
      id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponse(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateFormat = format(new Date(date), "yyyy-MM-dd");
  const getTodosQuery = `
    SELECT
      *
    FROM 
      todo
    WHERE 
      CAST(strftime("%Y",due_date) AS INTEGER)=${new Date(
        dateFormat
      ).getFullYear()}
      AND CAST(strftime("%m",due_date) AS INTEGER)=${
        new Date(dateFormat).getMonth() + 1
      };`;
  const data = await db.all(getTodosQuery);
  response.send(
    data.map((each) => {
      return convertDbObjectToResponse(each);
    })
  );
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(dueDate);
  const createTodoQuery = `
    INSERT INTO
      todo(id,todo,priority,status,category,due_date)
    VALUES
      (
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          ${dueDate}
      );`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
      todo
    WHERE
      id=${todoId};`;
  await db.run(getTodoQuery);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  if (status !== undefined) {
    const updateTodoQuery = `
      UPDATE
        todo
      SET 
        status='${status}'
      WHERE
        id=${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Status Updated");
  } else if (priority !== undefined) {
    const updateTodoQuery = `
      UPDATE
        todo
      SET 
        priority='${priority}'
      WHERE
        id=${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    const updateTodoQuery = `
      UPDATE
        todo
      SET 
        todo='${todo}'
      WHERE
        id=${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    const updateTodoQuery = `
      UPDATE
        todo
      SET 
        category='${category}'
      WHERE
        id=${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Category Updated");
  } else {
    const updateTodoQuery = `
      UPDATE
        todo
      SET 
        due_date=${dueDate}
      WHERE
        id=${todoId};`;
    await db.run(updateTodoQuery);
    response.send("dueDate Updated");
  }
});

module.exports = app;
