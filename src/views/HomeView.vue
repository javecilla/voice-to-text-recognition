<script setup lang="ts">
import TheWelcome from '@/components/TheWelcome.vue'
import HelloWorld from '@/components/HelloWorld.vue'
</script>

<template>
  <div class="home-container">
    <div class="home-layout">
      <header>
        <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

        <div class="wrapper">
          <HelloWorld msg="You did it!" />

          <nav>
            <RouterLink to="/native-voice-to-text">Try Voice App</RouterLink>
          </nav>
        </div>
      </header>

      <main>
        <TheWelcome />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* --- 1. THEME STYLES (Moved from Global) --- */
/* Use :deep() to target elements inside Child Components (HelloWorld, TheWelcome) */

:deep(a),
:deep(.green) {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1); /* Vue Green */
  transition: 0.4s;
}

@media (hover: hover) {
  :deep(a:hover) {
    background-color: hsla(160, 100%, 37%, 0.2); /* Green Glow */
  }
}

/* --- 2. LAYOUT STYLES (Existing) --- */
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.home-layout {
  width: 100%;
  max-width: 1280px;
  padding: 2rem;
  font-weight: normal;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  .home-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0 2rem;
    column-gap: 2rem;
  }

  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap, 160px) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
