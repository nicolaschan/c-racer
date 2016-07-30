#include <stdio.h>

int main()
{
  long n = 1;

  for (int x = 0; x < 1000; x++)
    for (int y = 0; y < 1000; y++)
      for (int z = 0; z < 1000; z++)
        n++;

  printf("%d", 4);
 
  return 0;
}