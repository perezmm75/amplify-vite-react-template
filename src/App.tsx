import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [title, setTitle] = useState("");
  const [genero, setGenero] = useState("");
  const [year, setYear] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function deleteTodo(id: string) {
    // Preguntar al usuario si está seguro de que desea eliminar la película
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta película?");
    if (confirmDelete) {
      client.models.Todo.delete({ id });
    }
  }

  function createTodo() {
    console.log("creado")
    client.models.Todo.create({ 
      title, 
      genero, 
      year, 
      platform,
      isSeen: false // Establecer por defecto como no visto 
    });

    // Clear the fields after submission
    setTitle("");
    setGenero("");
    setYear("");
    setPlatform("");
  }
  // Función para alternar el estado "visto" de una película
  function toggleSeen(id: string) {
    const updatedTodo = todos.find(todo => todo.id === id);
    if (updatedTodo) {
      updatedTodo.isSeen = !updatedTodo.isSeen; // Cambiar el estado de visto
      client.models.Todo.update(updatedTodo); // Actualizar en la base de datos
      setTodos([...todos]); // Forzar la actualización de la lista
    }
  }
  return (
    <main>
      <h1>Todas las películas</h1>
      <h1>Usuario: {user?.signInDetails?.loginId}</h1>
      
      <div>
        <input 
          type="text" 
          placeholder="Título" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <select value={genero} onChange={(e) => setGenero(e.target.value)}>
          <option value="">Selecciona un género</option>
          <option value="Acción">Acción</option>
          <option value="Aventura">Aventura</option>
          <option value="Catastrofe">Catastrofe</option>
          <option value="Ciencia Fición">Ciencia Ficción</option>
          <option value="Comedia">Comedia</option>
          <option value="Drama">Drama</option>
          <option value="Fantasía">Fantasía</option>
          <option value="Musical">Musical</option>
          <option value="Suspense">Suspense</option>
          <option value="Terror">Terror</option>
          <option value="Policiaca">Policiaca</option>
        </select>
        <input 
          type="text" 
          placeholder="Año" 
          value={year} 
          onChange={(e) => setYear(e.target.value)} 
        />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">Selecciona una plataforma</option>
          <option value="Netflix">Netflix</option>
          <option value="Max">Max</option>
          <option value="Amazon Prime">Amazon Prime</option>
          <option value="Disney+">Disney+</option>
          <option value="Sky Showtime">Sky Showtime</option>
          <option value="AppleTV+">AppleTV+</option>
        </select>
        <button onClick={createTodo}>Añadir film</button>
      </div>
      
      <ul>
      {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} - {todo.genero} - {todo.year} - {todo.platform}
            <button onClick={() => deleteTodo(todo.id)}>Eliminar</button>
            {/* Botón para marcar como visto o no visto */}
            
              {todo.isSeen ? "👁️‍🗨️" : "👁️"} {/* Ojo cerrado o abierto */}
      
          </li>
        ))}
      </ul>
      
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
