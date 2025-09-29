#include <bits/stdc++.h>
using namespace std;

const unsigned MAXN = 0x40000;
const unsigned MAXNumBlocks = 0x2000;
const unsigned block_size = 32;

default_random_engine gen(time(0));
uniform_int_distribution<unsigned> distrib(0, block_size - 1);

unsigned power(double spd) {
	if (spd < 3)
		return 0;
	if (spd >= 11)
		return 3000;
	if (spd < 7)
		if (spd < 5)
			if (spd < 4)
				if (spd < 3.5)
					return 40;
				else
					return 168;
			else
				if (spd < 4.5)
					return 305;
				else
					return 484;
		else
			if (spd < 6)
				if (spd < 5.5)
					return 684;
				else
					return 916;
			else
				if (spd < 6.5)
					return 1199;
				else
					return 1533;
	else
		if (spd < 9)
			if (spd < 8)
				if (spd < 7.5)
					return 1918;
				else
					return 2303;
			else
				if (spd < 8.5)
					return 2589;
				else
					return 2802;
		else
			if (spd < 10)
				if (spd < 9.5)
					return 2918;
				else
					return 2963;
			else
				if (spd < 10.5)
					return 2991;
				else
					return 2995;
	return 0;
}

unsigned n = 0;
unsigned num_blocks;
unsigned perm[MAXNumBlocks];
struct DataPoint {
	unsigned year, month, date, hour, minute;
	double spd, deg;
	unsigned energy;
} wind_data[MAXN];
bool spd_first(const DataPoint& a, const DataPoint& b) {
	return a.spd < b.spd;
}

int main() {
	FILE *fi = fopen("../wind.csv", "r");
	FILE *fo = fopen("blocks.json", "w");
	fscanf(fi, "ts,spd,deg");
	for (n = 0; n < MAXN; n++) {
		if (fscanf(fi, "%u-%u-%u %u:%u,%lf,%lf", &wind_data[n].year, &wind_data[n].month, &wind_data[n].date, &wind_data[n].hour, &wind_data[n].minute, &wind_data[n].spd, &wind_data[n].deg) <= 0)
			break;
		wind_data[n].energy = power(wind_data[n].spd);
	}
	num_blocks = n / block_size;
	n = num_blocks * block_size;
	sort(wind_data, wind_data + n, spd_first);
	printf("%u\n", wind_data[240000].energy);
	fputc('[', fo);
	for (unsigned i = 0; i < num_blocks; i++) {
		perm[i] = i;
	}
	for (unsigned i = 0; i < num_blocks; i++) {
		unsigned j = uniform_int_distribution(i, num_blocks - 1)(gen);
		perm[i] ^= perm[j] ^= perm[i] ^= perm[j];
	}
	for (unsigned i = 0; i < num_blocks; i++) {
		unsigned offset = perm[i] * block_size;
		unsigned r = offset + distrib(gen);
		unsigned energy = 0;
		for (unsigned j = 0; j < block_size; j++) {
			energy += wind_data[offset + j].energy;
		}
		if (i)
			fputc(',', fo);
		fprintf(fo, "{\"t\":\"%04u-%02u-%02uT%02u:%02u+0800\",\"v\":%.3lf,\"d\":%.3lf,\"e\":%u,\"E\":%u}", wind_data[r].year, wind_data[r].month, wind_data[r].date, wind_data[r].hour, wind_data[r].minute, wind_data[r].spd, wind_data[r].deg, wind_data[r].energy, energy);
	}
	fputc(']', fo);
	return 0;
}