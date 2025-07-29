import React, { useState, useEffect, useCallback } from "react";
import { post, get } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { fetchUserAttributes } from "aws-amplify/auth";
import dayjs from "dayjs";

const neumorphicCard =
  "bg-[#F0F2F5] rounded-xl shadow-[5px_5px_10px_#d9d9d9,-5px_-5px_10px_#ffffff]";
const neumorphicCardInset =
  "bg-[#F0F2F5] rounded-xl shadow-[inset_5px_5px_10px_#d9d9d9,inset_-5px_-5px_10px_#ffffff]";
const neumorphicButton =
  "bg-[#F0F2F5] text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-[3px_3px_6px_#d9d9d9,-3px_-3px_6px_#ffffff] active:shadow-[inset_3px_3px_6px_#d9d9d9,inset_-3px_-3px_6px_#ffffff]";

const TransactionForm = ({ onNewTransaction }) => {
  const [type, setType] = useState("gasto");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      setFeedback({
        message: "Monto y descripción son requeridos.",
        type: "error",
      });
      return;
    }
    setIsLoading(true);
    setFeedback({ message: "", type: "" });
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("No se pudo obtener el token de sesión.");
      }

      const restOperation = post({
        apiName: "FinanzasAPI",
        path: "/transaccion",
        options: {
          body: {
            type,
            amount: parseFloat(amount),
            description,
            category: category || "General",
          },
          headers: { Authorization: idToken },
        },
      });
      await restOperation.response;
      setFeedback({ message: "¡Transacción guardada!", type: "success" });
      onNewTransaction();
      setAmount("");
      setDescription("");
      setCategory("");
    } catch (error) {
      console.error("Error al guardar:", error);
      setFeedback({
        message: "Error al guardar. Intenta de nuevo.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
    }
  };

  return (
    <div className={`${neumorphicCard} p-6`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Registrar Transacción
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setType("ingreso")}
            className={`${
              type === "ingreso"
                ? "shadow-[inset_3px_3px_6px_#d9d9d9,inset_-3px_-3px_6px_#ffffff]"
                : ""
            } flex-1 py-2 rounded-lg font-semibold`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType("gasto")}
            className={`${
              type === "gasto"
                ? "shadow-[inset_3px_3px_6px_#d9d9d9,inset_-3px_-3px_6px_#ffffff]"
                : ""
            } flex-1 py-2 rounded-lg font-semibold`}
          >
            Gasto
          </button>
        </div>
        <input
          type="number"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${neumorphicCardInset} w-full p-2 text-gray-700 focus:outline-none`}
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${neumorphicCardInset} w-full p-2 text-gray-700 focus:outline-none`}
          required
        />
        <input
          type="text"
          placeholder="Categoría (opcional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${neumorphicCardInset} w-full p-2 text-gray-700 focus:outline-none`}
        />
        <button
          type="submit"
          className={`${neumorphicButton} w-full`}
          disabled={isLoading}
        >
          {isLoading ? "Guardando..." : "Guardar"}
        </button>
        {feedback.message && (
          <p
            className={`text-center font-semibold ${
              feedback.type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </form>
    </div>
  );
};

const Report = ({ transactions }) => {
  const groupedByMonth = transactions.reduce((acc, t) => {
    const monthKey = dayjs(t.createdAt).format("YYYY-MM");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(t);
    return acc;
  }, {});

  const totalEnCuenta = transactions.reduce(
    (acc, t) =>
      acc +
      (t.type === "ingreso" ? parseFloat(t.amount) : -parseFloat(t.amount)),
    0
  );

  return (
    <div className={`${neumorphicCard} p-6 mt-8 lg:mt-0`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Reporte Mensual</h2>
      {Object.entries(groupedByMonth).map(([month, trans]) => {
        const ingresos = trans.filter((t) => t.type === "ingreso");
        const gastos = trans.filter((t) => t.type === "gasto");
        const totalIngresos = ingresos.reduce(
          (acc, t) => acc + parseFloat(t.amount),
          0
        );
        const totalGastos = gastos.reduce(
          (acc, t) => acc + parseFloat(t.amount),
          0
        );
        const balance = totalIngresos - totalGastos;

        return (
          <div key={month} className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Mes: {month}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
              <div className={`${neumorphicCard} p-4`}>
                <p className="text-lg font-semibold text-green-600">Ingresos</p>
                <p className="text-2xl">${totalIngresos.toFixed(2)}</p>
              </div>
              <div className={`${neumorphicCard} p-4`}>
                <p className="text-lg font-semibold text-red-600">Gastos</p>
                <p className="text-2xl">${totalGastos.toFixed(2)}</p>
              </div>
              <div className={`${neumorphicCard} p-4`}>
                <p className="text-lg font-semibold text-blue-600">Balance</p>
                <p className="text-2xl">${balance.toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-green-700 mb-2">
                  Ingresos
                </h4>
                <ul className="space-y-2">
                  {ingresos.map((t) => (
                    <li
                      key={t.transactionId}
                      className={`${neumorphicCardInset} p-3 flex justify-between`}
                    >
                      <span>
                        {t.description} ({t.category})
                      </span>
                      <span>${parseFloat(t.amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-red-700 mb-2">
                  Gastos
                </h4>
                <ul className="space-y-2">
                  {gastos.map((t) => (
                    <li
                      key={t.transactionId}
                      className={`${neumorphicCardInset} p-3 flex justify-between`}
                    >
                      <span>
                        {t.description} ({t.category})
                      </span>
                      <span>${parseFloat(t.amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-8 text-center">
        <p className="text-xl font-bold text-gray-800">
          Total en cuenta: ${totalEnCuenta.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export const Dashboard = ({ signOut }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email || "Usuario");
      } catch (err) {
        console.error("Error al obtener el email:", err);
        setUserEmail("Usuario");
      }
    };

    getUserEmail();
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("No se pudo obtener el token de sesión.");
      }

      const restOperation = get({
        apiName: "FinanzasAPI",
        path: "/reportes",
        options: { headers: { Authorization: idToken } },
      });
      const { body } = await restOperation.response;
      const data = await body.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error al obtener transacciones:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Hola, {userEmail.split("@")[0] || "Usuario"}!
        </h1>
        <button onClick={signOut} className={neumorphicButton}>
          Cerrar Sesión
        </button>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TransactionForm onNewTransaction={fetchTransactions} />
        </div>
        <div className="lg:col-span-2">
          {isLoading ? (
            <p>Cargando reportes...</p>
          ) : (
            <Report transactions={transactions} />
          )}
        </div>
      </main>
    </div>
  );
};
