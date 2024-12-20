import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import Table from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

function FavoritesList() {
  const { user } = useAuthenticator();
  const [favorites, setFavorites] = useState<Array<Schema["Favorite"]["type"]>>([]);

  useEffect(() => {
    fetchFavorites();
    const createSubscription = client.models.Favorite.onCreate({
      filter: { idUser: { eq: user.userId } },
    }).subscribe({
      next: async () => fetchFavorites(),
    });

    const deleteSubscription = client.models.Favorite.onDelete({
      filter: { idUser: { eq: user.userId } },
    }).subscribe({
      next: async () => fetchFavorites(),
    });

    return () => {
      createSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, [user]);

  // Obtener las películas favoritas del usuario
  const fetchFavorites = async () => {
    try {
      const { data: userFavorites } = await client.models.Favorite.list({
        filter: { idUser: { eq: user.userId } },
      });

      const favoriteMovies = await Promise.all(
        userFavorites.map(async (favorite) => {
          const { data: movie } = await client.models.Todo.get({
            id: favorite.idTodo!,
          });
          return { ...movie, favoriteId: favorite.id }; // Añadir el id del favorito
        })
      );

      setFavorites(favoriteMovies);
    } catch (error) {
      console.error("Error al obtener las películas favoritas:", error);
    }
  };

  // Eliminar una película de favoritos
  const removeFavorite = async (favoriteId: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta película de tus favoritos?");
    if (confirmDelete) {
      try {
        await client.models.Favorite.delete({ id: favoriteId });
        await fetchFavorites();
        window.alert("Película eliminada de favoritos");
      } catch (error) {
        console.error("Error al eliminar favorito:", error);
        window.alert("Error al eliminar favorito");
      }
    } else {
      console.log("Eliminación cancelada por el usuario");
    }
  };

  return (
    <main>
      <Table
        columnDefinitions={[
          { id: "tipo", header: "Tipo", cell: (item) => item.tipo },
          { id: "title", header: "Título", cell: (item) => item.title },
          { id: "genero", header: "Género", cell: (item) => item.genero },
          { id: "year", header: "Año", cell: (item) => item.year },
          { id: "platform", header: "Plataforma", cell: (item) => item.platform },
          {
            id: "actions",
            header: "Acciones",
            cell: (item) => (
              <>
              <Button
                  iconName="delete-marker"
                  variant="icon"
                  ariaLabel="Borrar de favoritos"
                  onClick={() => removeFavorite(item.favoriteId)}
                ></Button>
              </>
            ),
          },
        ]}
        items={favorites}
        loadingText="Cargando películas favoritas..."
        empty={
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>No tienes películas favoritas</b>
            </SpaceBetween>
          </Box>
        }
        header={<Header>Lista de favoritos</Header>}
      />
    </main>
  );
}

export default FavoritesList;
