import { useAuthenticator } from "@aws-amplify/ui-react";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import "./App.css"; // Asegúrate de importar el CSS que creamos
import Favorites from "./components/Favorites";
import { AppLayout, SpaceBetween } from "@cloudscape-design/components";
import FilmsAdded from "./components/FilmsAdded";

function App() {
  const { user, signOut } = useAuthenticator();

  const handleMenuClick = (item: any) => {
    if (item.detail.id === "signout") {
      signOut();
    }
  };

  return (
    <div>
      {/* Aquí incluimos la barra de navegación */}
      <TopNavigation
        identity={{
          href: "#",
          title: "Películas",
          logo: {
            src: "/Video-film.svg", // Puedes reemplazar esto con el logo que desees
            alt: "Películas",
          },
        }}
        utilities={[
          {
            type: "button",
            text: user?.signInDetails?.loginId || "", // Muestra el correo al lado de "Perfil"
            iconName: "email", // Opcional: puedes elegir un icono apropiado o eliminar esta línea
          },
          {
            type: "menu-dropdown",
            text: "Perfil",
            description: user?.signInDetails?.loginId,
            iconName: "user-profile",
            items: [{ id: "signout", text: "Cerrar sesión" }],
            onItemClick: handleMenuClick, // Manejador para acciones de los ítems del menú
          },
        ]}
      />
      <AppLayout
        toolsHide={true}
        navigationHide={true}
        content={
          <SpaceBetween size={"l"}>
            <FilmsAdded />
            <Favorites />
          </SpaceBetween>
        }
      />
    </div>
  );
}

export default App;
