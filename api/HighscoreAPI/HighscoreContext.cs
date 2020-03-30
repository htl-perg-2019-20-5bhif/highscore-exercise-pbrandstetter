using HighscoreAPI.Model;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HighscoreAPI
{
    public class HighscoreContext : DbContext
    {
        public HighscoreContext(DbContextOptions<HighscoreContext> options) : base(options)
        { }

        public DbSet<Highscore> Highscores { get; set; }
    }
}
