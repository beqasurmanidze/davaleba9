// საჭირო მოდულების იმპორტი
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const EXPENSES_FILE = path.join(__dirname, "expenses.json");

// Middleware JSON ფორმატის დასამუშავებლად
app.use(express.json());

// დამხმარე ფუნქცია - წაიკითხოს ფაილი
const readExpenses = () => {
  if (!fs.existsSync(EXPENSES_FILE)) {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify([]));
  }
  const data = fs.readFileSync(EXPENSES_FILE);
  return JSON.parse(data);
};

// დამხმარე ფუნქცია - ჩაწეროს ფაილში
const writeExpenses = (expenses) => {
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2));
};

// 1) შექმნა (Create)
app.post("/expenses", (req, res) => {
  const expenses = readExpenses();
  const newExpense = { id: Date.now().toString(), ...req.body };
  expenses.push(newExpense);
  writeExpenses(expenses);
  res.status(201).json(newExpense);
});

// 2) წაკითხვა (Read) ფეჯინეიშენით
app.get("/expenses", (req, res) => {
  const { page = 1, take = 10 } = req.query;
  const expenses = readExpenses();
  const start = (page - 1) * take;
  const paginatedExpenses = expenses.slice(start, start + parseInt(take));
  res.json(paginatedExpenses);
});

// 3) განახლება (Update)
app.put("/expenses/:id", (req, res) => {
  const { id } = req.params;
  const expenses = readExpenses();
  const index = expenses.findIndex((expense) => expense.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  expenses[index] = { ...expenses[index], ...req.body };
  writeExpenses(expenses);
  res.json(expenses[index]);
});

// 4) წაშლა (Delete) ავტორიზაციის შემოწმებით
app.delete("/expenses/:id", (req, res) => {
  const { id } = req.params;
  const apiKey = req.headers.key;

  if (!apiKey || apiKey !== "your-secret-key") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const expenses = readExpenses();
  const index = expenses.findIndex((expense) => expense.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const deletedExpense = expenses.splice(index, 1);
  writeExpenses(expenses);
  res.json({ message: "Expense deleted", expense: deletedExpense[0] });
});

// ერორების გლობალური ჰენდლერი
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// სერვერის გაშვება
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
