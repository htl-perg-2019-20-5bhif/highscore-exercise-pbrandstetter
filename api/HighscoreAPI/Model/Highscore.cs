using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HighscoreAPI.Model
{
    public class Highscore
    {
        public int HighscoreId { get; set; }
        public string Initials { get; set; }
        public int Points { get; set; }
    }
}
