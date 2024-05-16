import argparse
import os
import pandas as pd
import matplotlib.pyplot as plt

def load_data(file_path):
    """ Load data from a CSV file. """
    try:
        return pd.read_csv(file_path, delimiter=';')
    except FileNotFoundError:
        print(f"Error: File not found {file_path}")
        return None
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return None

def plot_data(data, node, object_entry, ax, separate_plots):
    """ Plot data on the given axis. """
    if separate_plots:
        plt.figure()
        ax = plt.gca()
    if len(data.columns) == 2:
        ax.plot(data.iloc[:, 0], data.iloc[:, 1], marker='o', linestyle='-', label=f"{node} {object_entry}")
        ax.set_title("Data Plot")
        ax.set_xlabel("Timestamp (microseconds)")
        ax.set_ylabel("Value")
        ax.grid(True)
        ax.legend()
    elif len(data.columns) > 2:
        fig, axes = plt.subplots(nrows=len(data.columns)-1, figsize=(10, 5 * (len(data.columns)-1)))
        for idx, column in enumerate(data.columns[1:]):
            if len(data.columns) - 1 > 1:
                ax = axes[idx]
            else:
                ax = axes
            ax.plot(data.iloc[:, 0], data.iloc[:, idx+1], marker='o', linestyle='-', label=f"{column}")
            ax.set_xlabel("Timestamp [us]")
            ax.set_ylabel(f"{column} Value")
            ax.grid(True)
        plt.tight_layout()
    if separate_plots:
        plt.show()

def main(args):
    """ Main function to process inputs and plot data. """
    fig, ax = plt.subplots(figsize=(10, 5))
    for i in range(0, len(args.nodes), 2):
        node = args.nodes[i]
        object_entry = args.nodes[i+1]
        file_path = os.path.join(args.path, node, f"{object_entry}.csv")
        data = load_data(file_path)
        if data is not None:
            plot_data(data, node, object_entry, ax, args.multiple)

    if not args.multiple:
        plt.show()

if __name__ == "__main__":
    # Setup argument parser
    parser = argparse.ArgumentParser(description="Plot object entry data from log files.")
    parser.add_argument('path', type=str, help='Path to the logging directory')
    parser.add_argument('nodes', nargs='+', help='List of node and object-entry names (e.g., node1 object1 node2 object2)')
    parser.add_argument('-m', '--multiple', action='store_true', help='Create separate plots for each object entry')

    args = parser.parse_args()
    main(args)
