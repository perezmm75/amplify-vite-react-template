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
  const [view, setView] = useState<{ [key: string]: boolean }>({});
  const [like, setLike] = useState<{ [key: string]: boolean }>({});
  const [likeCount, setLikeCount] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchViewAndFavoritesAndLikefilmAndCounts = async () => {
      const [favoriteMovies, viewMovies, likeMovies, moviesWithLikes] =
        await Promise.all([
          client.models.Favorite.list({
            filter: { idUser: { eq: user.userId } },
          }),
          client.models.Viewfilm.list({
            filter: { idUser: { eq: user.userId } },
          }),
          client.models.Likefilm.list({
            filter: { idUser: { eq: user.userId } },
          }),
          client.models.Todo.list(),
        ]);

      setFavorites(
        favoriteMovies.data.reduce((acc, item) => {
          acc[item.idTodo] = true;
          return acc;
        }, {})
      );

      setView(
        viewMovies.data.reduce((acc, item) => {
          acc[item.idTodo] = true;
          return acc;
        }, {})
      );

      setLike(
        likeMovies.data.reduce((acc, item) => {
          acc[item.idTodo] = true;
          return acc;
        }, {})
      );

      setLikeCount(
        moviesWithLikes.data.reduce((acc, item) => {
          acc[item.id] = item.likeCount || 0;
          return acc;
        }, {})
      );

      const subscription = client.models.Todo.observeQuery().subscribe({
        next: (data) => setTodos(data.items),
      });
      return () => subscription.unsubscribe();
    };

    fetchViewAndFavoritesAndLikefilmAndCounts();
  }, [user.userId]);

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
        return null;
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
        likeCount,
      });

      setTipo("");
      setTitle("");
      setGenero("");
      setYear("");
      setPlatform("");
      setShowForm(false);
      setLikeCount;
    } catch (error) {
      console.error("Error al crear la película:", error);
    }
  }

  async function deleteTodo(id: string, addedBy: string) {
    if (addedBy === user?.signInDetails?.loginId) {
      if (
        window.confirm("¿Estás seguro de que quieres eliminar esta película?")
      ) {
        await client.models.Todo.delete({ id });
      }
    } else {
      window.alert("No puedes borrar los títulos de otros usuarios");
    }
  }

  async function markAsFav(id: string) {
    const { data: existingFavorites } = await client.models.Favorite.list({
      filter: { idUser: { eq: user.userId }, idTodo: { eq: id } },
    });
    if (existingFavorites.length > 0) {
      if (window.confirm("¿Eliminar esta película de tus favoritos?")) {
        await client.models.Favorite.delete({ id: existingFavorites[0].id });
        setFavorites((prev) => ({ ...prev, [id]: false }));
        window.alert("Película eliminada de favoritos");
      }
    } else {
      await client.models.Favorite.create({ idTodo: id, idUser: user.userId });
      setFavorites((prev) => ({ ...prev, [id]: true }));
      window.alert("Película añadida a favoritos");
    }
  }

  async function markAsView(id: string) {
    const { data: existingView } = await client.models.Viewfilm.list({
      filter: { idUser: { eq: user.userId }, idTodo: { eq: id } },
    });
    if (existingView.length > 0) {
      if (window.confirm("¿Marcar esta película como no vista?")) {
        await client.models.Viewfilm.delete({ id: existingView[0].id });
        setView((prev) => ({ ...prev, [id]: false }));
        window.alert("Película marcada como No vista");
      }
    } else {
      await client.models.Viewfilm.create({ idTodo: id, idUser: user.userId });
      setView((prev) => ({ ...prev, [id]: true }));
      window.alert("Película marcada como vista");
    }
  }

  async function markAsLike(id: string) {
    try {
      // Obtener la película actual para actualizar el contador de likes
      const currentTodo = await client.models.Todo.get({ id });
      const currentLikeCount = currentTodo.data?.likeCount || 0;
      console.log(currentLikeCount); //El error que tenia era que currentLikeCount no podia acceder al valor con "currentTodo.likeCount || 0;"
  
      // Verificar si el usuario ya ha dado like a este ítem
      const { data: existingLike } = await client.models.Likefilm.list({
        filter: {
          idUser: { eq: user.userId },
          idTodo: { eq: id },
        },
      });
  
      if (existingLike.length > 0) {
        // Si el usuario ya ha dado like, eliminarlo
        const likeToDelete = existingLike[0];
        await client.models.Likefilm.delete({ id: likeToDelete.id });
  
        // Reducir el contador de likes globalmente sin permitir valores negativos
        const newLikeCount = Math.max(0, currentLikeCount - 1);
        await client.models.Todo.update({ id, likeCount: newLikeCount });
  
        // Actualizar la cuenta de likes en el estado local
        setLikeCount((prevCounts) => ({
          ...prevCounts,
          [id]: newLikeCount,
        }));
  
        // Actualizar el estado local de likes
        setLike((prev) => ({ ...prev, [id]: false }));
      } else {
        // Si no hay like del usuario, agregar uno
        await client.models.Likefilm.create({
          idTodo: id,
          idUser: user.userId,
        });
  
        // Aumentar el contador de likes globalmente
        const newLikeCount = currentLikeCount + 1;
        await client.models.Todo.update({ id, likeCount: newLikeCount });
  
        // Actualizar la cuenta de likes en el estado local
        setLikeCount((prevCounts) => ({
          ...prevCounts,
          [id]: newLikeCount,
        }));
  
        // Actualizar el estado local de likes
        setLike((prev) => ({ ...prev, [id]: true }));
      }
    } catch (error) {
      console.error("Error al gestionar like:", error);
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
            id: "likeCount",
            header: "LikesCount",
            cell: (item) => likeCount[item.id] || 0,
            sortingField: "likeCount",
          },
          {
            id: "platform",
            header: "Plataforma",
            sortingField: "platform",
            cell: (item) => (
              <img
                src={getPlatformLogo(item.platform)}
                alt={item.platform}
                style={{ width: "60px", height: "auto" }}
              />
            ),
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
                <Button
                  iconName={like[item.id] ? "thumbs-up" : "status-in-progress"}
                  variant="icon"
                  ariaLabel="Like"
                  onClick={() => markAsLike(item.id)}
                />
                <Button
                  iconName={
                    view[item.id] ? "status-positive" : "status-pending"
                  }
                  variant="icon"
                  ariaLabel="Marcar como visto"
                  onClick={() => markAsView(item.id)}
                />
                <Button
                  iconName={favorites[item.id] ? "star-filled" : "star"}
                  variant="icon"
                  ariaLabel="Marcar como favorito"
                  onClick={() => markAsFav(item.id)}
                />
                <Button
                  iconName="delete-marker"
                  variant="icon"
                  ariaLabel="Eliminar"
                  onClick={() => deleteTodo(item.id, item.addedBy)}
                />
              </>
            ),
          },
        ]}
        items={todos}
        loadingText="Cargando tus películas..."
        empty={
          <Box textAlign="center">
            <b>No hay películas registradas</b>
            <p>Añade una película</p>
          </Box>
        }
        header={
          <SpaceBetween size="m">
            <Button onClick={() => setShowForm(true)}>Nueva película</Button>
          </SpaceBetween>
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
