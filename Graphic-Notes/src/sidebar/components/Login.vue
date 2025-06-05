<template>
  <div class="auth-form">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? "Logging in..." : "Login" }}
      </button>
    </form>
    <p>
      Don't have an account?
      <button @click="$emit('switchToRegister')" class="link-button">
        Register here
      </button>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNotesStore } from "../stores/notes";

const emit = defineEmits(["loginSuccess", "switchToRegister"]);
const notesStore = useNotesStore();

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

async function handleLogin() {
  isLoading.value = true;
  errorMessage.value = "";
  const success = await notesStore.login(username.value, password.value);
  isLoading.value = false;
  if (success) {
    emit("loginSuccess");
  } else {
    errorMessage.value =
      notesStore.error || "Login failed. Please check your credentials.";
  }
}
</script>

<style scoped>
.auth-form {
  max-width: 300px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}
button:disabled {
  background-color: #ccc;
}
.error-message {
  color: red;
  margin-bottom: 10px;
  font-size: 0.9em;
}
p {
  margin-top: 15px;
  font-size: 0.9em;
  text-align: center;
}
.link-button {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 1em; /* Ensure it matches paragraph font size or adjust as needed */
  width: auto; /* Override full width for link-like buttons */
}
</style>
