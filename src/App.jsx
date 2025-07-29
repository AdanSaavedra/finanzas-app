import { Authenticator, useTheme, View } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Dashboard } from "./Dashboard.jsx";

function App() {
  
  // Personalización de colores para el formulario de login/registro
  const theme = {
    name: "financetheme",
    tokens: {
      colors: {
        background: {
          primary: { value: "#F0F2F5" },
          secondary: { value: "#FFFFFF" },
        },
        font: {
          interactive: { value: "#007bff" },
        },
      },
      components: {
        button: {
          primary: {
            backgroundColor: { value: "#007bff" },
          },
        },
      },
    },
  };

  const components = {
    Header() {
      const { tokens } = useTheme();
      return (
        <View textAlign="center" padding={tokens.space.large}>
          <h1 className="text-3xl font-bold text-gray-700">App de Finanzas</h1>
        </View>
      );
    },
  };

  return (
    <div className="bg-[#F0F2F5] min-h-screen">
      <Authenticator components={components} theme={theme}>
        {({ signOut, user }) => (
          <main>
            <Dashboard signOut={signOut} user={user} />
          </main>
        )}
      </Authenticator>
    </div>
  );
}

export default App;
