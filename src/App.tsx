import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import Table from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import './App.css'; // Asegúrate de importar el CSS que creamos


const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [title, setTitle] = useState("");
  const [genero, setGenero] = useState("");
  const [year, setYear] = useState("");
  const [platform, setPlatform] = useState("");
  const [tipo, setTipo] = useState("");
  const [showForm, setShowForm] = useState(false); // Estado para mostrar/ocultar el formulario

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function deleteTodo(id: string) {
    // Preguntar al usuario si está seguro de que desea eliminar la película
    const confirmDelete = window.confirm(
      "¿Estás seguro de que quieres eliminar esta película?"
    );
    if (confirmDelete) {
      client.models.Todo.delete({ id });
    }
  }

  function createTodo() {
    client.models.Todo.create({
      tipo,
      title,
      genero,
      year,
      platform,
      isSeen: false, // Establecer por defecto como no visto
      addedBy: user?.signInDetails?.loginId, // Guardar el usuario que añadió la película
    });

    // Clear the fields after submission
    setTipo("");
    setTitle("");
    setGenero("");
    setYear("");
    setPlatform("");
  }

  async function markAsView(id: string, isSeen: boolean) {
    await client.models.Todo.update({
      id,
      isSeen: !isSeen
    });
  }
  const handleMenuClick = (item: any) => {
    if (item.detail.id === "signout") {
      signOut();
    }
  };

  return (
    <main>
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
            text: "Link",
            href: "https://example.com/",
            external: true,
            externalIconAriaLabel: " (opens in a new tab)",
          },
          {
            type: "button",
            iconName: "notification",
            title: "Notificaciones",
            ariaLabel: "Notificaciones (sin leer)",
            badge: true,
            disableUtilityCollapse: false,
          },
          {
            type: "menu-dropdown",
            iconName: "settings",
            ariaLabel: "Configuración",
            title: "Configuración",
            items: [
              {
                id: "settings-org",
                text: "Configuración organizacional",
              },
              {
                id: "settings-project",
                text: "Configuración de proyecto",
              },
            ],
          },
          {
            type: "menu-dropdown",
            text: "Perfil",
            description: user?.signInDetails?.loginId,
            iconName: "user-profile",
            items: [
              { id: "profile", text: "Perfil" },
              { id: "preferences", text: "Preferencias" },
              { id: "signout", text: "Cerrar sesión" }, 
            ],
            onItemClick: handleMenuClick, // Manejador para acciones de los ítems del menú

          },
        ]}
      />

      {/* Botón para mostrar/ocultar el formulario */}
      <Button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Ocultar formulario" : "Añadir película"}
      </Button>

      {/* Mostrar el formulario solo si showForm es true */}
      {showForm && (
        <Container className="form-container" header={<h2>Añadir Película</h2>}>
        <SpaceBetween direction="vertical" size="l">
          <FormField label="Tipo">
            <Select
              selectedOption={{ label: tipo || "Selecciona tipo", value: tipo }}
              onChange={(e) => setTipo(e.detail.selectedOption.value)}
              options={[
                { label: "Película", value: "Pelicula" },
                { label: "Serie", value: "Serie" },
                { label: "Documental", value: "Documental" },
              ]}
            />
          </FormField>

          <FormField label="Título">
            <Input
              value={title}
              onChange={(e) => setTitle(e.detail.value)}
              placeholder="Título"
            />
          </FormField>

          <FormField label="Género">
            <Select
              selectedOption={{ label: genero || "Selecciona un género", value: genero }}
              onChange={(e) => setGenero(e.detail.selectedOption.value)}
              options={[
                { label: "Acción", value: "Acción" },
                { label: "Aventura", value: "Aventura" },
                { label: "Catastrofe", value: "Catastrofe" },
                { label: "Ciencia Ficción", value: "Ciencia Ficción" },
                { label: "Comedia", value: "Comedia" },
                { label: "Drama", value: "Drama" },
                { label: "Fantasía", value: "Fantasía" },
                { label: "Musical", value: "Musical" },
                { label: "Suspense", value: "Suspense" },
                { label: "Terror", value: "Terror" },
                { label: "Policiaca", value: "Policiaca" },
              ]}
            />
          </FormField>

          <FormField label="Año">
            <Input
              value={year}
              onChange={(e) => setYear(e.detail.value)}
              placeholder="Año"
            />
          </FormField>

          <FormField label="Plataforma">
            <Select
              selectedOption={{ label: platform || "Selecciona una plataforma", value: platform }}
              onChange={(e) => setPlatform(e.detail.selectedOption.value)}
              options={[
                { label: "Netflix", value: "Netflix" },
                { label: "Max", value: "Max" },
                { label: "Amazon Prime", value: "Amazon Prime" },
                { label: "Disney+", value: "Disney+" },
                { label: "SkyShowtime", value: "SkyShowtime" },
                { label: "AppleTV+", value: "AppleTV+" },
              ]}
            />
          </FormField>

          <Button onClick={createTodo} variant="primary">
              Añadir Película
            </Button>
          </SpaceBetween>
        </Container>
      )}
      
      {/* Tabla de Cloudscape */}
      <Table
        columnDefinitions={[
          {
            id: "tipo",
            header: "Tipo",
            cell: (item) => item.tipo,
            sortingField: "tipo",
          },
          {
            id: "title",
            header: "Título",
            cell: (item) => item.title,
            sortingField: "title",
          },
          {
            id: "genero",
            header: "Género",
            cell: (item) => item.genero,
            sortingField: "genero",
          },
          {
            id: "year",
            header: "Año",
            cell: (item) => item.year,
            sortingField: "year",
          },
          {
            id: "platform",
            header: "Plataforma",
            cell: (item) => item.platform,
            sortingField: "platform",
          },
          {
            id: "isSeen",
            header: "Estado",
            cell: (item) => (item.isSeen ? "Visto" : "No visto"),
          },
          {
            id: "addedBy",
            header: "Añadido por...",
            cell: (item) => item.addedBy,
          },
          {
            id: "actions",
            header: "Acciones",
            cell: (item) => (
              <>
                <Button onClick={() => deleteTodo(item.id)}>Eliminar</Button>
                <Button onClick={() => markAsView(item.id, item.isSeen)}>
                  {item.isSeen ? "NO visto" : "Visto"}
                </Button>
              </>
            ),
          },
        ]}
        items={todos}
        loadingText="Cargando películas..."
        empty={
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>No hay películas</b>
              <Button onClick={createTodo}>Añadir película</Button>
            </SpaceBetween>
          </Box>
        }
        header={<Header>Películas añadidas</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={2} />}
      />
    </main>
  );
}

export default App;
