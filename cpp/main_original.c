#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PLACES 100
#define NAME_LEN 100
#define INF 999999999

char places[MAX_PLACES][NAME_LEN];
int graph[MAX_PLACES][MAX_PLACES];
int n = 0;

/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

// To handle trailing newlines and input buffer issues cleanly
void clearInputBuffer()
{
    int c;
    while ((c = getchar()) != '\n' && c != EOF) { }
}

int findPlace(char name[])
{
    int i;
    for (i = 0; i < n; i++)
    {
        if (strcmp(places[i], name) == 0)
        {
            return i;
        }
    }
    return -1;
}

void showPlaces()
{
    int i;
    printf("\n========================================\n");
    printf("              ALL PLACES\n");
    printf("========================================\n");

    if (n == 0)
    {
        printf("No places added yet.\n");
        return;
    }

    for (i = 0; i < n; i++)
    {
        printf("%d. %s\n", i + 1, places[i]);
    }
}

/* =========================================================
   FILE HANDLING
   ========================================================= */

void initializeGraph()
{
    int i, j;
    for (i = 0; i < MAX_PLACES; i++)
    {
        for (j = 0; j < MAX_PLACES; j++)
        {
            graph[i][j] = 0;
        }
    }
}

void saveData()
{
    FILE *file;
    int i, j;

    file = fopen("data.txt", "w");
    if (file == NULL)
    {
        printf("\nError: Cannot save data!\n");
        return;
    }

    fprintf(file, "%d\n", n);

    /* Save place names */
    for (i = 0; i < n; i++)
    {
        fprintf(file, "%s\n", places[i]);
    }

    /* Save routes */
    for (i = 0; i < n; i++)
    {
        for (j = i + 1; j < n; j++)
        {
            if (graph[i][j] != 0)
            {
                fprintf(file, "%d %d %d\n", i, j, graph[i][j]);
            }
        }
    }

    fclose(file);
}

void loadData()
{
    FILE *file;
    int i;
    int a, b, cost;

    file = fopen("data.txt", "r");

    if (file == NULL)
    {
        file = fopen("data.txt", "w");
        if (file != NULL)
        {
            fprintf(file, "0\n");
            fclose(file);
        }
        n = 0;
        return;
    }

    if (fscanf(file, "%d\n", &n) != 1) {
        n = 0;
        fclose(file);
        return;
    }

    for (i = 0; i < n; i++)
    {
        if (fgets(places[i], NAME_LEN, file) != NULL) {
            places[i][strcspn(places[i], "\n")] = '\0';
        }
    }

    while (fscanf(file, "%d %d %d", &a, &b, &cost) == 3)
    {
        if (a >= 0 && a < n && b >= 0 && b < n)
        {
            graph[a][b] = cost;
            graph[b][a] = cost;
        }
    }

    fclose(file);
}

/* =========================================================
   ADD & DELETE PLACE
   ========================================================= */

void addPlace()
{
    char name[NAME_LEN];

    if (n >= MAX_PLACES)
    {
        printf("\nMaximum place limit reached!\n");
        return;
    }

    printf("\nEnter place/building name: ");
    fgets(name, NAME_LEN, stdin);
    name[strcspn(name, "\n")] = '\0';

    if (strlen(name) == 0)
    {
        printf("\nInvalid name!\n");
        return;
    }

    if (findPlace(name) != -1)
    {
        printf("\nThis place already exists!\n");
        return;
    }

    strcpy(places[n], name);
    n++;
    saveData();

    printf("\nPlace '%s' added successfully!\n", name);
    printf("Data permanently saved in data.txt\n");
}

void deletePlace()
{
    int choice;
    int index, i, j;

    showPlaces();
    if (n == 0) return;

    printf("\nEnter place number to delete: ");
    if (scanf("%d", &choice) != 1) {
        printf("\nInvalid input format!\n");
        clearInputBuffer();
        return;
    }
    clearInputBuffer();

    if (choice < 1 || choice > n)
    {
        printf("\nInvalid place number!\n");
        return;
    }

    index = choice - 1;

    /* Shift place names */
    for (i = index; i < n - 1; i++)
    {
        strcpy(places[i], places[i + 1]);
    }

    /* Shift graph rows */
    for (i = index; i < n - 1; i++)
    {
        for (j = 0; j < n; j++)
        {
            graph[i][j] = graph[i + 1][j];
        }
    }

    /* Shift graph columns */
    for (i = 0; i < n - 1; i++)
    {
        for (j = index; j < n - 1; j++)
        {
            graph[i][j] = graph[i][j + 1];
        }
    }

    n--;

    /* Clear unused row and column */
    for (i = 0; i < MAX_PLACES; i++)
    {
        graph[n][i] = 0;
        graph[i][n] = 0;
    }

    saveData();

    printf("\nPlace deleted successfully!\n");
    printf("Related routes were also removed.\n");
}

/* =========================================================
   ADD, UPDATE & DELETE ROUTE
   ========================================================= */

void addRoute()
{
    int source, destination, cost;

    if (n < 2)
    {
        printf("\nYou need at least 2 places first.\n");
        return;
    }

    showPlaces();

    printf("\nEnter source place number: ");
    scanf("%d", &source);
    printf("Enter destination place number: ");
    scanf("%d", &destination);

    if (source < 1 || source > n || destination < 1 || destination > n)
    {
        printf("\nInvalid place number!\n");
        clearInputBuffer();
        return;
    }

    if (source == destination)
    {
        printf("\nSource and destination cannot be the same.\n");
        clearInputBuffer();
        return;
    }

    printf("Enter route cost/distance: ");
    if (scanf("%d", &cost) != 1 || cost <= 0)
    {
        printf("\nCost must be a valid positive number.\n");
        clearInputBuffer();
        return;
    }
    clearInputBuffer();

    source--;
    destination--;

    graph[source][destination] = cost;
    graph[destination][source] = cost;

    saveData();

    printf("\nRoute added/updated successfully!\n");
}

void updateRoute()
{
    int source, destination, new_cost;

    if (n < 2)
    {
        printf("\nYou need at least 2 places first.\n");
        return;
    }

    showPlaces();

    printf("\nEnter source place number: ");
    scanf("%d", &source);
    printf("Enter destination place number: ");
    scanf("%d", &destination);

    if (source < 1 || source > n || destination < 1 || destination > n)
    {
        printf("\nInvalid place number!\n");
        clearInputBuffer();
        return;
    }

    source--;
    destination--;

    if (graph[source][destination] == 0)
    {
        printf("\nNo direct route exists between these places to update.\n");
        clearInputBuffer();
        return;
    }

    printf("Current cost is: %d\n", graph[source][destination]);
    printf("Enter new route cost/distance: ");

    if (scanf("%d", &new_cost) != 1 || new_cost <= 0)
    {
        printf("\nCost must be a valid positive number.\n");
        clearInputBuffer();
        return;
    }
    clearInputBuffer();

    graph[source][destination] = new_cost;
    graph[destination][source] = new_cost;

    saveData();
    printf("\nRoute cost updated successfully!\n");
}

void deleteRoute()
{
    int source, destination;

    if (n < 2) return;

    showPlaces();

    printf("\nEnter source place number: ");
    scanf("%d", &source);
    printf("Enter destination place number: ");
    scanf("%d", &destination);
    clearInputBuffer();

    if (source < 1 || source > n || destination < 1 || destination > n)
    {
        printf("\nInvalid place number!\n");
        return;
    }

    source--;
    destination--;

    if (graph[source][destination] == 0)
    {
        printf("\nNo direct route exists between these places.\n");
        return;
    }

    graph[source][destination] = 0;
    graph[destination][source] = 0;

    saveData();

    printf("\nRoute deleted successfully!\n");
}

void showRoutes()
{
    int i, j;
    int found = 0;

    printf("\n========================================\n");
    printf("              ALL ROUTES\n");
    printf("========================================\n");

    for (i = 0; i < n; i++)
    {
        for (j = i + 1; j < n; j++)
        {
            if (graph[i][j] != 0)
            {
                printf("%d. %s <---> %s | Cost: %d\n",
                       ++found, places[i], places[j], graph[i][j]);
            }
        }
    }

    if (!found)
    {
        printf("No routes available.\n");
    }
}

/* =========================================================
   ALL POSSIBLE PATHS - DFS
   ========================================================= */

int visited[MAX_PLACES];
int path[MAX_PLACES];
int pathCount;
int foundAnyPath = 0;

void printCurrentPath()
{
    int i;
    foundAnyPath = 1;
    for (i = 0; i < pathCount; i++)
    {
        printf("%s", places[path[i]]);
        if (i < pathCount - 1)
        {
            printf(" -> ");
        }
    }
    printf("\n");
}
//DFS
void findAllPaths(int current, int destination)
{
    int i;

    visited[current] = 1;
    path[pathCount] = current;
    pathCount++;

    if (current == destination)
    {
        printCurrentPath();
    }
    else
    {
        for (i = 0; i < n; i++)
        {
            if (graph[current][i] != 0 && visited[i] == 0)
            {
                findAllPaths(i, destination);
            }
        }
    }

    pathCount--;
    visited[current] = 0;
}

void allPossibleRoutes()
{
    int source, destination, i;

    if (n < 2) return;
    showPlaces();

    printf("\nEnter source place number: ");
    scanf("%d", &source);
    printf("Enter destination place number: ");
    scanf("%d", &destination);
    clearInputBuffer();

    if (source < 1 || source > n || destination < 1 || destination > n)
    {
        printf("\nInvalid place number!\n");
        return;
    }

    source--;
    destination--;

    if (source == destination)
    {
        printf("\nSource and destination are the same.\n");
        return;
    }

    for (i = 0; i < n; i++) visited[i] = 0;

    pathCount = 0;
    foundAnyPath = 0;

    printf("\n========================================\n");
    printf("           ALL POSSIBLE ROUTES\n");
    printf("========================================\n");

    findAllPaths(source, destination);

    if (!foundAnyPath)
    {
        printf("No possible routes found between '%s' and '%s'.\n", places[source], places[destination]);
    }
}

/* =========================================================
   DIJKSTRA - SHORTEST PATH
   ========================================================= */

int findMinimum(int distance[], int used[])
{
    int minimum = INF;
    int index = -1;
    int i;

    for (i = 0; i < n; i++)
    {
        if (used[i] == 0 && distance[i] < minimum)
        {
            minimum = distance[i];
            index = i;
        }
    }
    return index;
}
//Dijkstra algo
void shortestPath()
{
    int source, destination;
    int distance[MAX_PLACES], parent[MAX_PLACES], used[MAX_PLACES], route[MAX_PLACES];
    int i, j, current, count;

    if (n < 2) return;
    showPlaces();

    printf("\nEnter source place number: ");
    scanf("%d", &source);
    printf("Enter destination place number: ");
    scanf("%d", &destination);
    clearInputBuffer();

    if (source < 1 || source > n || destination < 1 || destination > n)
    {
        printf("\nInvalid place number!\n");
        return;
    }

    source--;
    destination--;

    for (i = 0; i < n; i++)
    {
        distance[i] = INF;
        parent[i] = -1;
        used[i] = 0;
    }

    distance[source] = 0;

    for (i = 0; i < n; i++)
    {
        current = findMinimum(distance, used);

        if (current == -1) break;
        used[current] = 1;

        for (j = 0; j < n; j++)
        {
            if (graph[current][j] != 0 && used[j] == 0 &&
                distance[current] + graph[current][j] < distance[j])
            {
                distance[j] = distance[current] + graph[current][j];
                parent[j] = current;
            }
        }
    }

    if (distance[destination] == INF)
    {
        printf("\nNo route exists between these places.\n");
        return;
    }

    count = 0;
    current = destination;

    while (current != -1)
    {
        route[count] = current;
        count++;
        current = parent[current];
    }

    printf("\n========================================\n");
    printf("             SHORTEST ROUTE\n");
    printf("========================================\n");
    printf("\nRoute: ");

    for (i = count - 1; i >= 0; i--)
    {
        printf("%s", places[route[i]]);
        if (i > 0) printf(" -> ");
    }

    printf("\n\nTotal Cost / Distance: %d\n", distance[destination]);
}

/* =========================================================
   MAIN
   ========================================================= */

int main()
{
    int choice;
    initializeGraph();
    loadData();

    printf("\n============================================\n");
    printf("          CAMPUS ROUTE PLANNER\n");
    printf("============================================\n");
    printf("\nData loaded successfully!\n");

    while (1)
    {
        printf("\n============================================\n");
        printf("                   MENU\n");
        printf("============================================\n");
        printf("1. Add Place / Building\n");
        printf("2. Delete Place / Building\n");
        printf("3. Add Route\n");
        printf("4. Update Route Cost\n");  // New feature
        printf("5. Delete Route\n");
        printf("6. Show All Places\n");
        printf("7. Show All Routes\n");
        printf("8. Find All Possible Routes\n");
        printf("9. Find Shortest Route\n");
        printf("10. Exit\n");

        printf("\nEnter your choice: ");
        if (scanf("%d", &choice) != 1) {
            printf("\nInvalid input! Please enter a number.\n");
            clearInputBuffer();
            continue;
        }
        clearInputBuffer();

        switch (choice)
        {
            case 1: addPlace(); break;
            case 2: deletePlace(); break;
            case 3: addRoute(); break;
            case 4: updateRoute(); break;
            case 5: deleteRoute(); break;
            case 6: showPlaces(); break;
            case 7: showRoutes(); break;
            case 8: allPossibleRoutes(); break;
            case 9: shortestPath(); break;
            case 10:
                printf("\nProgram closed.\n");
                return 0;
            default:
                printf("\nInvalid choice! Try again.\n");
        }
    }
    return 0;
}
