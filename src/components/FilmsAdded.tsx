import { useEffect, useState } from "react";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import Button from "@cloudscape-design/components/button";
import Table from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import { Modal } from "@cloudscape-design/components";
import { useAuthenticator } from "@aws-amplify/ui-react";

// Importar las imágenes de las plataformas
import NetflixLogo from "../../public/logos/Netflix.jpg";
import AppleTvLogo from "../../public/logos/appletv.jpg";
import DisneyLogo from "../../public/logos/disney.jpg";
import MaxLogo from "../../public/logos/max.jpg";
import PrimeLogo from "../../public/logos/prime.jpg";
import SkyShowtimeLogo from "../../public/logos/skyshowtime.jpg";

const client = generateClient<Schema>();

export default function FilmsAdded() {
  const { user } = useAuthenticator();

  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [title, setTitle] = useState("");
  const [genero, setGenero] = useState("");
  const [year, setYear] = useState("");
  const [platform, setPlatform] = useState("");
  const [tipo, setTipo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchFavorites = async () => {
      const favoriteMovies = await client.models.Favorite.list({
        filter: { idUser: { eq: user.userId } },
      });
      setFavorites(
        favoriteMovies.data.reduce((acc, item) => {
          acc[item.idTodo] = true;
          return acc;
        }, {})
      );
    };

    fetchFavorites();

    const subscription = client.models.Todo.observeQuery().subscribe({
      next: async (data) => {
        setTodos([...data.items]);
      },
    });
    return () => subscription.unsubscribe(); // Limpiar la suscripción al desmontar el componente
  }, [user.userId]);

  // Función para obtener el logo según la plataforma
  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case "Netflix":
        return NetflixLogo;
      case "Amazon Prime":
        return PrimeLogo;
      case "Disney+":
        return DisneyLogo;
      case "Max":
        return MaxLogo;
      case "AppleTV+":
        return AppleTvLogo;
      case "SkyShowtime":
        return SkyShowtimeLogo;
      default:
        return null; // Si no tienes un logo para esa plataforma
    }
  };

  function createTodo() {
    try {
      client.models.Todo.create({
        tipo,
        title,
        genero,
        year,
        platform,
        addedBy: user?.signInDetails?.loginId,
      });

      // Limpiar los campos después de la presentación
      setTipo("");
      setTitle("");
      setGenero("");
      setYear("");
      setPlatform("");
      setShowForm(false);
    } catch (error) {
      console.error("Error al crear la película:", error);
    }
  }

  function deleteTodo(id: string, addedBy: string) {
    if (addedBy === user?.signInDetails?.loginId) {
      const confirmDelete = window.confirm(
        "¿Estás seguro de que quieres eliminar esta película?"
      );
      if (confirmDelete) {
        client.models.Todo.delete({ id });
      }
    } else {
      window.alert("No puedes borrar los títulos de otros usuarios");
    }
  }

  async function markAsFav(id: string) {
    try {
      // Consultar si la película ya está en favoritos
      const { data: existingFavorites } = await client.models.Favorite.list({
        filter: {
          idUser: { eq: user.userId },
          idTodo: { eq: id },
        },
      });
  
      if (existingFavorites.length > 0) {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta película de tus favoritos?");
        if (confirmDelete) {
          // Si el usuario confirma, eliminar el favorito
          const favoriteToDelete = existingFavorites[0];
          await client.models.Favorite.delete({ id: favoriteToDelete.id });
          setFavorites((prevFavorites) => ({
            ...prevFavorites,
            [id]: false, // Cambiar el estado a no favorito
          }));
          // Mostrar mensaje de éxito
          window.alert("Película eliminada de favoritos");
        } else {
          // Si el usuario cancela, no se hace nada
          console.log("Eliminación cancelada por el usuario");
        }
      } else {
        // Si no está en favoritos, añadirlo
        await client.models.Favorite.create({
          idTodo: id,
          idUser: user.userId,
        });
        setFavorites((prevFavorites) => ({
          ...prevFavorites,
          [id]: true, // Marcar como favorito
        }));
        window.alert("Película añadida a favoritos");
      }
    } catch (error) {
      console.error("Error al marcar como favorito:", error);
    }
  }
  
  

  return (
    <div>
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
            cell: (item) => (
              <img
                src={getPlatformLogo(item.platform)}
                alt={item.platform}
                style={{ width: "60px", height: "auto" }} // Ajusta el tamaño del logo según prefieras
              />
            ),
            sortingField: "platform",
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
                {/* Botón para marcar como favorito */}
                <Button
                  iconName={favorites[item.id] ? "star-filled" : "star"}
                  variant="icon"
                  ariaLabel="Fav"
                  onClick={() => markAsFav(item.id)}
                ></Button>
                <Button
                  iconName="delete-marker"
                  variant="icon"
                  ariaLabel="Borrar"
                  onClick={() => deleteTodo(item.id, item.addedBy)}
                ></Button>
              </>
            ),
          },
        ]}
        items={todos}
        header={
          <Box>
            <SpaceBetween direction="horizontal" size="1">
              <Button onClick={() => setShowForm(true)}>
                Agregar película
              </Button>
            </SpaceBetween>
          </Box>
        }
      />
      {/* Modal para agregar nuevas películas */}
      <Modal
        onDismiss={() => setShowForm(false)}
        visible={showForm}
        header="Agregar nueva película"
      >
        <div>
          <FormField label="Tipo">
            <Select
              selectedOption={
                tipo
                  ? { label: tipo, value: tipo }
                  : { label: "Selecciona tipo", value: "" }
              }
              onChange={(e) => setTipo(e.detail.selectedOption.value)}
              options={[
                { label: "Película", value: "Pelicula" },
                { label: "Serie", value: "Serie" },
                { label: "Documental", value: "Documental" },
              ]}
            />
          </FormField>
          <FormField label="Título">
            <Input value={title} onChange={(e) => setTitle(e.detail.value)} />
          </FormField>
          <FormField label="Género">
            <Select
              selectedOption={
                genero
                  ? { label: genero, value: genero }
                  : { label: "Selecciona un género", value: "" }
              }
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
            <Input value={year} onChange={(e) => setYear(e.detail.value)} />
          </FormField>
          <FormField label="Plataforma">
            <Select
              selectedOption={
                platform
                  ? { label: platform, value: platform }
                  : { label: "Selecciona plataforma", value: "" }
              }
              onChange={({ detail }) =>
                setPlatform(detail.selectedOption.value)
              }
              options={[
                { value: "Netflix", label: "Netflix" },
                { value: "Amazon Prime", label: "Amazon Prime" },
                { value: "Disney+", label: "Disney+" },
                { value: "Max", label: "Max" },
                { value: "AppleTV+", label: "AppleTV+" },
                { value: "SkyShowtime", label: "SkyShowtime" },
              ]}
            />
          </FormField>
          <Button onClick={createTodo}>Agregar</Button>
        </div>
      </Modal>
    </div>
  );
}
