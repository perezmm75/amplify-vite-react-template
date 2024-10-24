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
import { Modal, StatusIndicator } from "@cloudscape-design/components";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "./FilmsAdded.css"; // para poner la estrella en amarillo

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
  const [showForm, setShowForm] = useState(false); // Estado para mostrar/ocultar el formulario
  const [likes, setLikes] = useState<{ [key: string]: number }>({}); // Para manejar los likes de cada película
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({}); // Estado para manejar favoritos
  const [vieweds, setVieweds] = useState<{ [key: string]: boolean }>({}); // Estado para manejar películas vistas

  useEffect(() => {
    const fetchFavorites = async () => {
      const favoriteMovies = await client.models.Favorite.list({
        filter: { idUser: { eq: user.userId } },
      });
      setFavorites(favoriteMovies.data.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {}));
    };

    fetchFavorites()

    const subscription = client.models.Todo.observeQuery().subscribe({
      next: async (data) => {
        setTodos([...data.items]);

        // Inicializa likes
        const initialLikes = data.items.reduce((acc, item) => {
          acc[item.id] = item.likes || 0; // Inicializa los likes si no existen
          return acc;
        }, {});
        setLikes(initialLikes);
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

  function createTodo() {
    try {
      client.models.Todo.create({
        tipo,
        title,
        genero,
        year,
        platform,
        addedBy: user?.signInDetails?.loginId, // Guardar el usuario que añadió la película
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

  async function voteMovie(id: string) {
    try {
      const todo = todos.find((item) => item.id === id);

      if (todo?.voters?.includes(user?.username)) {
        alert("Ya has votado por esta película.");
        return;
      }

      const updatedLikes = (likes[id] || 0) + 1;
      await client.models.Todo.update({
        id,
        likes: updatedLikes,
        voters: [...(todo?.voters || []), user?.username], // Añadir el usuario a la lista de votantes
      });

      setLikes({ ...likes, [id]: updatedLikes });
    } catch (error) {
      console.error("Error al votar por la película:", error);
    }
  }

  async function markAsFav(id: string) {
    console.log(favorites);
    try {
      const isFavorite = favorites[id];

      if (isFavorite) {
        const favoriteToDelete = await client.models.Favorite.list({
          filter: {
            idUser: { eq: user.userId },
            idTodo: { eq: id },
          },
        });

        if (favoriteToDelete.length > 0) {
          await client.models.Favorite.delete({ id: favoriteToDelete[0].id });
        }
        setFavorites((prevFavorites) => ({
          ...prevFavorites,
          [id]: false, // Cambiar el estado
        }));
      } else {
        await client.models.Favorite.create({
          idTodo: id,
          idUser: user.userId,
        });
        setFavorites((prevFavorites) => ({
          ...prevFavorites,
          [id]: true,
        }));
      }
    } catch (error) {
      console.error("Error al marcar como favorito:", error);
    }
  }

  async function markAsViewed(id: string) {
    try {
      const isViewed = vieweds[id];

      if (isViewed) {
        const viewToDelete = await client.models.Viewfilm.list({
          filter: {
            idUser: { eq: user.userId },
            idTodo: { eq: id },
          },
        });

        if (viewToDelete.length > 0) {
          await client.models.Viewfilm.delete({ id: viewToDelete[0].id });
        }
      } else {
        await client.models.Viewfilm.create({
          idTodo: id,
          idUser: user.userId,
        });
      }

      setVieweds((prevViewds) => ({
        ...prevViewds,
        [id]: !isViewed, // Cambiar el estado
      }));
    } catch (error) {
      console.error("Error al marcar como vista:", error);
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
            id: "likes",
            header: "Likes",
            cell: (item) => likes[item.id] || 0,
          },
          {
            id: "actions",
            header: "Acciones",
            cell: (item) => (
              <>
                {/* Actualización del botón de Like */}
                <Button
                  iconName="thumbs-up"
                  variant="icon"
                  onClick={() => voteMovie(item.id)}
                  ariaLabel="Like" // Esto añade accesibilidad
                ></Button>
                <Button
                  iconName="status-positive"
                  variant="icon"
                  onClick={() => markAsViewed(item.id)}
                  ariaLabel="Vista"
                >
                  <span
                    className={`status-positive ${
                      vieweds[item.id] ? "filled" : ""
                    }`}
                  ></span>
                </Button>
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
                  ? { label: tipo, value: tipo } // Si `tipo` tiene valor, asigna ambos `label` y `value`
                  : { label: "Selecciona tipo", value: "" } // Si no, usa un valor por defecto
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
                  ? { label: genero, value: genero } // Similar lógica para `genero`
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
                  ? { label: platform, value: platform } // Si `platform` tiene valor, asigna ambos `label` y `value`
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
