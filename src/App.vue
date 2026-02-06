<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useAccountsStore } from "@/stores/accounts";
import type { Account } from "@/types/accounts";

const store = useAccountsStore();

onMounted(() => {
  store.initFromStorage();
  if (store.accounts.length === 0) store.addAccount();
});

const hint = "Метки вводить через ';' (например: office;urgent;vip). Макс 50 символов.";

function labelRaw(a: Account) {
  return a.label.map(x => x.text).join("; ");
}

const labelDraft = ref<Record<string, string>>({});

function getLabelDraft(a: Account) {
  return labelDraft.value[a.id] ?? labelRaw(a);
}
function setLabelDraft(a: Account, v: string) {
  labelDraft.value[a.id] = v;
}

function validate(a: Account, rawLabel?: string) {
  const errors = {
    label: false,
    login: false,
    password: false,
  };

  const raw = rawLabel ?? labelRaw(a);
  if (raw.length > 50) errors.label = true;

  if (!a.login.trim() || a.login.length > 100) errors.login = true;

  if (a.type === "LOCAL") {
    const pwd = a.password ?? "";
    if (!pwd.trim() || pwd.length > 100) errors.password = true;
  }

  return errors;
}

function onBlurLabel(a: Account) {
  store.setTouched(a.id, "label", true);

  const raw = getLabelDraft(a);
  const errs = validate(a, raw);

  if (!errs.label) {
    store.setLabelFromRaw(a.id, raw);
    labelDraft.value[a.id] = labelRaw(a);
  }
}

function onBlurLogin(a: Account) {
  store.setTouched(a.id, "login", true);
  const errs = validate(a);
  if (!errs.login) store.setLogin(a.id, a.login);
}

function onBlurPassword(a: Account) {
  store.setTouched(a.id, "password", true);
  const errs = validate(a);
  if (!errs.password && a.password !== null) store.setPassword(a.id, a.password);
}

function onChangeType(a: Account, type: "LDAP" | "LOCAL") {
  store.setTouched(a.id, "type", true);
  store.setType(a.id, type);
}

const accounts = computed(() => store.accounts);
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="py-6" style="max-width: 980px;">
        <div class="d-flex align-center justify-space-between ga-3">
          <div>
            <h2 class="mb-1">Учетные записи</h2>
            <div class="text-medium-emphasis">
              {{ hint }}
            </div>
          </div>

          <v-btn color="primary" prepend-icon="mdi-plus" @click="store.addAccount()">
            Добавить
          </v-btn>
        </div>

        <v-alert v-if="accounts.length === 0" class="mt-6" type="info" variant="tonal">
          Нет учетных записей.
        </v-alert>

        <v-card v-for="a in accounts" :key="a.id" class="mt-6" variant="elevated">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Учетная запись</span>
            <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click="store.removeAccount(a.id)">
              Удалить
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-row dense>
              <!-- LABEL -->
              <v-col cols="12" md="8">
                <v-text-field label="Метка (необязательно)" :hint="'Макс. 50 символов. Разделяйте ;'" persistent-hint
                  :model-value="getLabelDraft(a)" @update:model-value="(v) => setLabelDraft(a, String(v))"
                  @blur="() => onBlurLabel(a)" :error="a.touched.label && getLabelDraft(a).length > 50"
                  :error-messages="a.touched.label && getLabelDraft(a).length > 50 ? ['Максимум 50 символов'] : []" />
              </v-col>

              <!-- TYPE -->
              <v-col cols="12" md="4">
                <v-select label="Тип записи" :items="[
                  { title: 'LDAP', value: 'LDAP' },
                  { title: 'Локальная', value: 'LOCAL' }
                ]" :model-value="a.type" @update:model-value="(v) => onChangeType(a, v as any)" />
              </v-col>

              <!-- LOGIN -->
              <v-col cols="12" md="6">
                <v-text-field label="Логин" :hint="'Обязательно. Макс. 100 символов.'" persistent-hint v-model="a.login"
                  @blur="() => onBlurLogin(a)" :error="a.touched.login && (!a.login.trim() || a.login.length > 100)"
                  :error-messages="a.touched.login && !a.login.trim()
                    ? ['Поле обязательно']
                    : a.touched.login && a.login.length > 100
                      ? ['Максимум 100 символов']
                      : []
                    " />
              </v-col>

              <!-- PASSWORD -->
              <v-col cols="12" md="6">
                <template v-if="a.type === 'LOCAL'">
                  <v-text-field label="Пароль" type="password" :hint="'Обязательно для Локальная. Макс. 100 символов.'"
                    persistent-hint :model-value="a.password ?? ''"
                    @update:model-value="(v) => { a.password = String(v) }" @blur="() => onBlurPassword(a)"
                    :error="a.touched.password && (!(a.password ?? '').trim() || (a.password ?? '').length > 100)"
                    :error-messages="a.touched.password && !(a.password ?? '').trim()
                        ? ['Поле обязательно']
                        : a.touched.password && (a.password ?? '').length > 100
                          ? ['Максимум 100 символов']
                          : []
                      " />
                </template>

                <template v-else>
                  <v-alert type="info" variant="tonal">
                    Для LDAP пароль не требуется (хранится как <b>null</b>)
                  </v-alert>
                </template>
              </v-col>
            </v-row>

            <div class="text-caption text-medium-emphasis mt-2">
              label (store): {{ a.label }}
            </div>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
