export function power(/** @type {number} */ spd) {
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
}